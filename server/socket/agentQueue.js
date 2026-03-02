import Redis from 'ioredis';
import Agent from '../models/Agent.js';
import Session from '../models/Session.js';
import { ROOM, SERVER_EVENTS } from '../../shared/constants.js';
import { estimateWait } from '../../shared/utils.js';

let redis;

/**
 * Initialize the Redis client for queue operations.
 * @param {Redis} redisClient
 */
export function initQueue(redisClient) {
    redis = redisClient;
}

const QUEUE_KEY = (orgId) => `queue:${orgId}`;

/**
 * Add a session to the waiting queue.
 * @param {string} orgId
 * @param {string} sessionId
 * @returns {Promise<number>} position in queue (1-indexed)
 */
export async function enqueue(orgId, sessionId) {
    const key = QUEUE_KEY(orgId);
    await redis.rpush(key, sessionId);
    const queue = await redis.lrange(key, 0, -1);
    return queue.indexOf(sessionId) + 1;
}

/**
 * Remove a session from the queue.
 * @param {string} orgId
 * @param {string} sessionId
 */
export async function dequeue(orgId, sessionId) {
    await redis.lrem(QUEUE_KEY(orgId), 0, sessionId);
}

/**
 * Get queue position of a session.
 * @param {string} orgId
 * @param {string} sessionId
 * @returns {Promise<number>} 1-indexed position, or -1 if not found
 */
export async function getPosition(orgId, sessionId) {
    const queue = await redis.lrange(QUEUE_KEY(orgId), 0, -1);
    const idx = queue.indexOf(sessionId);
    return idx === -1 ? -1 : idx + 1;
}

/**
 * Try to auto-assign the next queued session to an available agent.
 * Called when an agent comes online or finishes a chat.
 * @param {string} orgId
 * @param {import('socket.io').Server} io
 */
export async function tryAutoAssign(orgId, io) {
    // Guard: Redis might not be ready yet on first boot
    if (!redis) return;

    const queue = await redis.lrange(QUEUE_KEY(orgId), 0, -1);
    if (!queue || !queue.length) return;

    // Find an available agent (defensive: handle missing activeSessions)
    const agents = await Agent.find({ orgId, status: 'online' });
    const available = agents.find(a => {
        const sessions = a.activeSessions || [];
        return sessions.length < (a.maxConcurrent || 5);
    });
    if (!available) return;


    const sessionId = queue[0];
    await dequeue(orgId, sessionId);

    // Update DB
    const session = await Session.findByIdAndUpdate(
        sessionId,
        { assignedAgent: available._id, status: 'live', liveAt: new Date() },
        { new: true }
    );
    if (!session) return;

    available.activeSessions.push(sessionId);
    await available.save();

    // Notify widget
    io.to(ROOM.session(sessionId)).emit(SERVER_EVENTS.AGENT_JOINED, {
        agentName: available.name,
        avatar: available.avatar,
    });

    // Notify agent
    io.to(ROOM.agent(String(available._id))).emit(SERVER_EVENTS.NEW_CONVERSATION, {
        session,
        customer: session.customer,
        preview: session.messages.at(-1)?.content || '',
    });

    // Notify all org agents to update their list
    io.to(ROOM.org(orgId)).emit('session_assigned', { sessionId, agentId: available._id });
}
