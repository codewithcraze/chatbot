import Session from '../models/Session.js';
import Agent from '../models/Agent.js';
import Booking from '../models/Booking.js';
import {
    CUSTOMER_EVENTS,
    AGENT_EVENTS,
    SERVER_EVENTS,
    ROOM,
    SESSION_STATUS,
    SENDER_TYPE,
    MESSAGE_STATUS,
} from '../../shared/constants.js';
import {
    enqueue,
    dequeue,
    getPosition,
    tryAutoAssign,
} from './agentQueue.js';
import { estimateWait } from '../../shared/utils.js';

/**
 * Register all Socket.IO event handlers.
 * @param {import('socket.io').Server} io
 */
export function registerHandlers(io) {
    io.on('connection', (socket) => {
        const { sessionId, agentId } = socket.handshake.query;

        // ─── CUSTOMER EVENTS ──────────────────────────────────────────────────────

        /**
         * Customer joins their session room.
         * Payload: { sessionId, orgId, customerInfo }
         */
        socket.on(CUSTOMER_EVENTS.JOIN_SESSION, async ({ sessionId, orgId, customerInfo = {} }) => {
            try {
                socket.join(ROOM.session(sessionId));
                let session = await Session.findById(sessionId)
                if (!session) {
                    // ── Brand new session ──────────────────────────────────────────
                    // Build the welcome message and save it to DB immediately so it
                    // becomes part of the persistent history (survives refresh).
                    const welcomeMsg = {
                        sender: SENDER_TYPE.BOT,
                        type: 'text',
                        content: "👋 Hi! Welcome to Travomint",
                        timestamp: new Date(),
                        status: MESSAGE_STATUS.DELIVERED,
                    };
                    const welcomeMsg2 = {
                        sender: SENDER_TYPE.BOT,
                        type: 'links',
                        content: "Download the Travomint app for an easier booking of Flight, Hotels, Car transfers & Vacations.",
                        timestamp: new Date(),
                        status: MESSAGE_STATUS.DELIVERED,
                        metadata: {
                            links: [
                                {
                                    label: "Google Play",
                                    url: "https://play.google.com/store/apps/details?id=com.snva.TravoMint&pcampaignid=web_share",
                                    icon: "https://play.google.com/store/apps/details?id=com.travomint.app"
                                },
                                {
                                    label: "App Store",
                                    url: "https://apps.apple.com/in/app/travomint-flight-hotels-car/id1603093439",
                                    icon: "https://play.google.com/store/apps/details?id=com.travomint.app"
                                }
                            ]
                        }
                    };
                    const welcomeMsg3 = {
                        sender: SENDER_TYPE.BOT,
                        type: 'text',
                        content: "Hey there! Not sure of what you are looking for? I can help!",
                        timestamp: new Date(),
                        status: MESSAGE_STATUS.DELIVERED,
                    };
                    session = await Session.create({
                        _id: sessionId,
                        orgId,
                        customer: customerInfo,
                        messages: [welcomeMsg, welcomeMsg2, welcomeMsg3],
                    });
                    // Send just the welcome message to the widget
                    const saved = session.messages[0];
                    setTimeout(() => {
                        socket.emit(SERVER_EVENTS.MESSAGE_RECEIVED, { ...welcomeMsg, _id: saved._id });
                    }, 500);
                    setTimeout(() => {
                        const saved2 = session.messages[1];
                        socket.emit(SERVER_EVENTS.MESSAGE_RECEIVED, { ...welcomeMsg2, _id: saved2._id });
                    }, 1000)
                    setTimeout(() => {
                        const saved3 = session.messages[2];
                        socket.emit(SERVER_EVENTS.MESSAGE_RECEIVED, { ...welcomeMsg3, _id: saved3._id });
                    }, 1500)
                } else {
                    // ── Reconnect / refresh ────────────────────────────────────────
                    if (Object.keys(customerInfo).length) {
                        await Session.findByIdAndUpdate(sessionId, { $set: { customer: customerInfo } });
                    }

                    // Convert Mongoose subdocuments to plain objects before emitting.
                    // Mongoose documents have internal methods/circular refs that can
                    // confuse socket.io's JSON serialization and cause silent failures.
                    const plainMessages = session.messages.map((m) => ({
                        _id: String(m._id),
                        sender: m.sender,
                        type: m.type,
                        content: m.content,
                        metadata: m.metadata,
                        status: m.status,
                        timestamp: m.timestamp,
                    }));

                    socket.emit(SERVER_EVENTS.SESSION_HISTORY, {
                        messages: plainMessages,
                        status: session.status,
                        agentInfo: session.assignedAgent
                            ? { agentId: String(session.assignedAgent) }
                            : null,
                    });
                }

            } catch (err) {
                socket.emit(SERVER_EVENTS.ERROR, { message: err.message });
            }
        });


        /**
         * Customer sends a message.
         * Payload: { sessionId, content, type }
         */
        socket.on(CUSTOMER_EVENTS.SEND_MESSAGE, async ({ sessionId, content, type = 'text' }) => {
            try {
                const msg = {
                    sender: SENDER_TYPE.CUSTOMER,
                    type,
                    content,
                    timestamp: new Date(),
                    status: MESSAGE_STATUS.DELIVERED,
                };

                // Persist message
                const session = await Session.findByIdAndUpdate(
                    sessionId,
                    { $push: { messages: msg } },
                    { new: true }
                );

                const savedMsg = session.messages.at(-1);
                const messagePayload = { sessionId, message: { ...msg, _id: savedMsg._id } };

                // 1. Broadcast to session room members (agents watching this specific session)
                //    Uses socket.to() so the sending widget doesn't receive its own message.
                socket.to(ROOM.session(sessionId)).emit(SERVER_EVENTS.CUSTOMER_MESSAGE, messagePayload);

                // 2. ALSO broadcast to the org room so CRM agents see it in real-time
                //    even before they have joined the session room (e.g., before accepting).
                //    Note: agents already in the session room may receive this twice —
                //    the CRM store deduplicates by message._id.
                if (session.orgId) {
                    socket.to(ROOM.org(session.orgId)).emit(SERVER_EVENTS.CUSTOMER_MESSAGE, messagePayload);
                }

                // 3. ACK back to the customer widget with the persisted _id
                socket.emit(SERVER_EVENTS.MESSAGE_ACK, {
                    localId: msg.localId,
                    _id: savedMsg._id,
                    status: MESSAGE_STATUS.DELIVERED,
                });
            } catch (err) {
                socket.emit(SERVER_EVENTS.ERROR, { message: err.message });
            }
        });

        /**
         * Customer requests a live agent.
         * Payload: { sessionId, reason }
         */
        socket.on(CUSTOMER_EVENTS.REQUEST_AGENT, async ({ sessionId, reason = '' }) => {
            try {
                const session = await Session.findById(sessionId);
                if (!session) return;

                const orgId = session.orgId;

                // Update session status
                await Session.findByIdAndUpdate(sessionId, {
                    status: SESSION_STATUS.WAITING,
                    queuedAt: new Date(),
                });

                // Add to queue
                const position = await enqueue(orgId, sessionId);
                const estimatedWait = estimateWait(position);

                // Notify customer of queue position
                socket.emit(SERVER_EVENTS.QUEUE_POSITION, { position, estimatedWait });

                // Notify all org agents about new conversation waiting
                const preview = reason || session.messages.at(-1)?.content || 'New chat request';
                io.to(ROOM.org(orgId)).emit(SERVER_EVENTS.NEW_CONVERSATION, {
                    session: { ...session.toObject(), status: SESSION_STATUS.WAITING },
                    customer: session.customer,
                    preview,
                });

                // Try to auto-assign immediately
                await tryAutoAssign(orgId, io);
            } catch (err) {
                socket.emit(SERVER_EVENTS.ERROR, { message: err.message });
            }
        });

        /**
         * Customer typing indicators.
         */
        socket.on(CUSTOMER_EVENTS.TYPING_START, ({ sessionId }) => {
            socket.to(ROOM.session(sessionId)).emit(SERVER_EVENTS.AGENT_TYPING, { isTyping: true, sender: 'customer' });
        });
        socket.on(CUSTOMER_EVENTS.TYPING_STOP, ({ sessionId }) => {
            socket.to(ROOM.session(sessionId)).emit(SERVER_EVENTS.AGENT_TYPING, { isTyping: false, sender: 'customer' });
        });

        /**
         * CRM agent subscribes to a session's real-time stream.
         * This lets them receive CUSTOMER_MESSAGE events without formally accepting the chat.
         * Payload: { sessionId }
         */
        socket.on('watch_session', ({ sessionId }) => {
            socket.join(ROOM.session(sessionId));
        });

        socket.on('unwatch_session', ({ sessionId }) => {
            socket.leave(ROOM.session(sessionId));
        });

        /**
         * Booking actions from widget.
         * Payload: { sessionId, action, payload }
         */
        socket.on(CUSTOMER_EVENTS.BOOKING_ACTION, async ({ sessionId, action, payload }) => {
            try {
                const session = await Session.findById(sessionId);
                if (!session) return;

                if (action === 'create') {
                    const booking = await Booking.create({
                        sessionId,
                        orgId: session.orgId,
                        service: payload.service,
                        datetime: payload.datetime,
                        customer: session.customer,
                        history: [{ action: 'created' }],
                    });

                    // Save confirmation message to session
                    await Session.findByIdAndUpdate(sessionId, {
                        $push: {
                            messages: {
                                sender: SENDER_TYPE.BOT,
                                type: 'booking_card',
                                content: `Booking confirmed! Your ID is **${booking._id}**`,
                                metadata: { bookingId: booking._id, service: booking.service, datetime: booking.datetime },
                                timestamp: new Date(),
                            },
                        },
                    });

                    socket.emit(SERVER_EVENTS.BOOKING_CONFIRMED, { booking });
                }

                if (action === 'status') {
                    const { bookingId, email } = payload;
                    const query = bookingId ? { _id: bookingId } : { 'customer.email': email, orgId: session.orgId };
                    const booking = await Booking.findOne(query);
                    if (!booking) {
                        socket.emit(SERVER_EVENTS.MESSAGE_RECEIVED, {
                            sender: SENDER_TYPE.BOT,
                            type: 'text',
                            content: "Sorry, I couldn't find a booking with that ID or email.",
                            timestamp: new Date(),
                        });
                        return;
                    }
                    socket.emit(SERVER_EVENTS.BOOKING_CONFIRMED, { booking, action: 'status' });
                }

                if (action === 'cancel') {
                    const booking = await Booking.findByIdAndUpdate(
                        payload.bookingId,
                        { status: 'cancelled', $push: { history: { action: 'cancelled' } } },
                        { new: true }
                    );
                    socket.emit(SERVER_EVENTS.BOOKING_CONFIRMED, { booking, action: 'cancel' });
                }

                if (action === 'modify') {
                    const booking = await Booking.findByIdAndUpdate(
                        payload.bookingId,
                        {
                            ...(payload.service && { service: payload.service }),
                            ...(payload.datetime && { datetime: payload.datetime }),
                            status: 'modified',
                            $push: { history: { action: 'modified' } },
                        },
                        { new: true }
                    );
                    socket.emit(SERVER_EVENTS.BOOKING_CONFIRMED, { booking, action: 'modify' });
                }
            } catch (err) {
                socket.emit(SERVER_EVENTS.ERROR, { message: err.message });
            }
        });

        // ─── AGENT EVENTS ─────────────────────────────────────────────────────────

        /**
         * Agent logs in and joins their org + personal rooms.
         * Payload: { agentId, orgId, status }
         */
        socket.on(AGENT_EVENTS.AGENT_LOGIN, async ({ agentId, orgId, status = 'online' }) => {
            try {
                socket.join(ROOM.org(orgId));
                socket.join(ROOM.agent(agentId));

                await Agent.findByIdAndUpdate(agentId, { status, lastActive: new Date() });

                // Broadcast status change to all org agents
                io.to(ROOM.org(orgId)).emit(SERVER_EVENTS.AGENT_STATUS_CHANGED, { agentId, status });

                // Try to assign any queued sessions
                if (status === 'online') {
                    await tryAutoAssign(orgId, io);
                }
            } catch (err) {
                socket.emit(SERVER_EVENTS.ERROR, { message: err.message });
            }
        });

        /**
         * Agent accepts a chat manually.
         * Payload: { sessionId, agentId, orgId }
         */
        socket.on(AGENT_EVENTS.ACCEPT_CHAT, async ({ sessionId, agentId, orgId }) => {
            try {
                await dequeue(orgId, sessionId);
                socket.join(ROOM.session(sessionId));

                const agent = await Agent.findById(agentId);
                if (!agent) return;

                await Session.findByIdAndUpdate(sessionId, {
                    assignedAgent: agentId,
                    status: SESSION_STATUS.LIVE,
                    liveAt: new Date(),
                });

                if (!agent.activeSessions.includes(sessionId)) {
                    agent.activeSessions.push(sessionId);
                    await agent.save();
                }

                // Notify customer
                io.to(ROOM.session(sessionId)).emit(SERVER_EVENTS.AGENT_JOINED, {
                    agentName: agent.name,
                    avatar: agent.avatar,
                });
            } catch (err) {
                socket.emit(SERVER_EVENTS.ERROR, { message: err.message });
            }
        });

        /**
         * Agent sends a message.
         * Payload: { sessionId, content, agentId, agentName }
         */
        socket.on(AGENT_EVENTS.SEND_MESSAGE, async ({ sessionId, content, agentId, agentName }) => {
            try {
                const msg = {
                    sender: SENDER_TYPE.AGENT,
                    type: 'text',
                    content,
                    metadata: { agentId, agentName },
                    timestamp: new Date(),
                    status: MESSAGE_STATUS.SENT,
                };

                const session = await Session.findByIdAndUpdate(
                    sessionId,
                    { $push: { messages: msg } },
                    { new: true }
                );

                const savedMsg = session.messages.at(-1);

                // Send to customer (widget) and other observers but NOT back to
                // the sending agent socket – the CRM ChatView adds it optimistically.
                socket.to(ROOM.session(sessionId)).emit(SERVER_EVENTS.MESSAGE_RECEIVED, {
                    ...msg,
                    _id: savedMsg._id,
                });

                // ACK to the agent with the persisted _id
                socket.emit(SERVER_EVENTS.MESSAGE_ACK, {
                    _id: savedMsg._id,
                    status: MESSAGE_STATUS.DELIVERED,
                });
            } catch (err) {
                socket.emit(SERVER_EVENTS.ERROR, { message: err.message });
            }
        });

        /**
         * Agent typing indicators.
         */
        socket.on(AGENT_EVENTS.TYPING_START, ({ sessionId }) => {
            socket.to(ROOM.session(sessionId)).emit(SERVER_EVENTS.AGENT_TYPING, { isTyping: true });
        });
        socket.on(AGENT_EVENTS.TYPING_STOP, ({ sessionId }) => {
            socket.to(ROOM.session(sessionId)).emit(SERVER_EVENTS.AGENT_TYPING, { isTyping: false });
        });

        /**
         * Agent resolves a chat.
         * Payload: { sessionId, agentId, orgId }
         */
        socket.on(AGENT_EVENTS.RESOLVE_CHAT, async ({ sessionId, agentId, orgId }) => {
            try {
                await Session.findByIdAndUpdate(sessionId, {
                    status: SESSION_STATUS.RESOLVED,
                    resolvedAt: new Date(),
                });

                await Agent.findByIdAndUpdate(agentId, {
                    $pull: { activeSessions: sessionId },
                });

                // Notify customer
                io.to(ROOM.session(sessionId)).emit(SERVER_EVENTS.SESSION_RESOLVED, {
                    message: 'This chat has been resolved. Thank you!',
                });

                // Notify org
                io.to(ROOM.org(orgId)).emit('session_resolved', { sessionId });

                // Try assigning next in queue
                await tryAutoAssign(orgId, io);
            } catch (err) {
                socket.emit(SERVER_EVENTS.ERROR, { message: err.message });
            }
        });

        /**
         * Agent transfers a chat to another agent.
         * Payload: { sessionId, targetAgentId, currentAgentId, orgId }
         */
        socket.on(AGENT_EVENTS.TRANSFER_CHAT, async ({ sessionId, targetAgentId, currentAgentId, orgId }) => {
            try {
                const targetAgent = await Agent.findById(targetAgentId);
                if (!targetAgent) return;

                await Session.findByIdAndUpdate(sessionId, { assignedAgent: targetAgentId });

                // Remove from current agent
                await Agent.findByIdAndUpdate(currentAgentId, {
                    $pull: { activeSessions: sessionId },
                });

                // Add to target agent
                if (!targetAgent.activeSessions.includes(sessionId)) {
                    targetAgent.activeSessions.push(sessionId);
                    await targetAgent.save();
                }

                // Notify the target agent
                io.to(ROOM.agent(targetAgentId)).emit(SERVER_EVENTS.NEW_CONVERSATION, {
                    sessionId,
                    transferred: true,
                    from: currentAgentId,
                });

                // Notify customer
                io.to(ROOM.session(sessionId)).emit(SERVER_EVENTS.CHAT_TRANSFERRED, {
                    agentName: targetAgent.name,
                });
            } catch (err) {
                socket.emit(SERVER_EVENTS.ERROR, { message: err.message });
            }
        });

        // ─── DISCONNECT ───────────────────────────────────────────────────────────
        socket.on('disconnect', async () => {
            // If this was an agent socket, try to update status (best-effort)
            if (agentId) {
                try {
                    const agent = await Agent.findByIdAndUpdate(agentId, {
                        status: 'offline',
                        lastActive: new Date(),
                    });
                    if (agent) {
                        io.to(ROOM.org(agent.orgId)).emit(SERVER_EVENTS.AGENT_STATUS_CHANGED, {
                            agentId,
                            status: 'offline',
                        });
                    }
                } catch {
                    // ignore
                }
            }
        });
    });
}
