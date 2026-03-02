import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAgentStore } from '../store/agentStore.js';
import { useConversationStore } from '../store/conversationStore.js';
import { useUiStore } from '../store/uiStore.js';
import { AGENT_EVENTS, SERVER_EVENTS } from '../../../shared/constants.js';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socketInstance = null;

export function useSocket() {
    const { currentAgent } = useAgentStore();
    const { upsertConversation, addMessage, updateSessionStatus } = useConversationStore();
    const { addNotification } = useUiStore();
    const socketRef = useRef(null);

    useEffect(() => {
        if (!currentAgent) return;

        const socket = io(SOCKET_URL, {
            query: { agentId: currentAgent._id },
            transports: ['websocket', 'polling'],
        });

        socketInstance = socket;
        socketRef.current = socket;

        socket.on('connect', () => {
            // Join org + personal room
            socket.emit(AGENT_EVENTS.AGENT_LOGIN, {
                agentId: currentAgent._id,
                orgId: currentAgent.orgId,
                status: 'online',
            });

            // Re-watch the currently active session in case we reconnected
            // while the agent had a conversation open
            const activeId = useConversationStore.getState().activeSessionId;
            if (activeId) {
                socket.emit('watch_session', { sessionId: activeId });
            }
        });


        // New conversation / waiting session
        socket.on(SERVER_EVENTS.NEW_CONVERSATION, (data) => {
            upsertConversation(data.session);
            addNotification({ type: 'new_chat', message: `New chat from ${data.customer?.name || 'Guest'}` });
            toast(`💬 New chat: ${data.customer?.name || 'Guest'}`, { icon: '💬' });
        });

        // Incoming customer message
        socket.on(SERVER_EVENTS.CUSTOMER_MESSAGE, ({ sessionId, message }) => {
            addMessage(sessionId, message);
        });

        // MESSAGE_ACK – server confirms an agent-sent message with the DB _id
        socket.on(SERVER_EVENTS.MESSAGE_ACK, ({ _id, status }) => {
            // The store dedup by _id ensures no duplicates; nothing else needed
            // unless we want to update the 'sent' → 'delivered' status indicator
        });

        // Agent status changed
        socket.on(SERVER_EVENTS.AGENT_STATUS_CHANGED, ({ agentId, status }) => {
            useAgentStore.getState().updateAgentStatus(agentId, status);
        });

        // Session assigned/resolved
        socket.on('session_assigned', ({ sessionId }) => {
            updateSessionStatus(sessionId, 'live');
        });
        socket.on('session_resolved', ({ sessionId }) => {
            updateSessionStatus(sessionId, 'resolved');
        });


        return () => {
            socket.disconnect();
            socketInstance = null;
        };
    }, [currentAgent?._id]);

    return socketRef.current;
}

/** Get the socket instance (for sending from components) */
export function getSocket() {
    return socketInstance;
}
