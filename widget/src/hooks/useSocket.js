import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { CUSTOMER_EVENTS, SERVER_EVENTS } from '../../../shared/constants.js';

const API_URL = import.meta.env.VITE_WIDGET_SOCKET_URL || 'http://localhost:3000';

/**
 * @param {string} sessionId
 * @param {string} orgId
 * @param {{ onSessionHistory, onMessage, onAgentJoined, onAgentTyping, onBookingConfirmed, onQueuePosition, onResolved, onAck }} handlers
 */
export function useSocket(sessionId, orgId, handlers = {}) {
    const socketRef = useRef(null);
    const handlersRef = useRef(handlers);   // always points to latest handlers
    const [connected, setConnected] = useState(false);

    // Keep the ref current on every render — no socket recreation needed
    useEffect(() => {
        handlersRef.current = handlers;
    });

    // Create socket ONCE per (sessionId, orgId) pair
    useEffect(() => {
        if (!sessionId) return;

        const socket = io(API_URL, {
            query: { sessionId },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            // Don't auto-connect — we control timing
            autoConnect: true,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit(CUSTOMER_EVENTS.JOIN_SESSION, { sessionId, orgId });
        });

        socket.on('disconnect', () => setConnected(false));

        // All event listeners delegate to the ref so they always call
        // the current version of each handler without stale closures
        socket.on(SERVER_EVENTS.SESSION_HISTORY, (d) => handlersRef.current.onSessionHistory?.(d));
        socket.on(SERVER_EVENTS.MESSAGE_RECEIVED, (d) => handlersRef.current.onMessage?.(d));
        socket.on(SERVER_EVENTS.MESSAGE_ACK, (d) => handlersRef.current.onAck?.(d));
        socket.on(SERVER_EVENTS.AGENT_JOINED, (d) => handlersRef.current.onAgentJoined?.(d));
        socket.on(SERVER_EVENTS.AGENT_TYPING, (d) => handlersRef.current.onAgentTyping?.(d));
        socket.on(SERVER_EVENTS.BOOKING_CONFIRMED, (d) => handlersRef.current.onBookingConfirmed?.(d));
        socket.on(SERVER_EVENTS.QUEUE_POSITION, (d) => handlersRef.current.onQueuePosition?.(d));
        socket.on(SERVER_EVENTS.SESSION_RESOLVED, (d) => handlersRef.current.onResolved?.(d));

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [sessionId, orgId]); // only recreate if session/org changes

    const sendMessage = useCallback((content, type = 'text', localId) => {
        socketRef.current?.emit(CUSTOMER_EVENTS.SEND_MESSAGE, { sessionId, content, type, localId });
    }, [sessionId]);

    const requestAgent = useCallback((reason = '') => {
        socketRef.current?.emit(CUSTOMER_EVENTS.REQUEST_AGENT, { sessionId, reason });
    }, [sessionId]);

    const sendTypingStart = useCallback(() => {
        socketRef.current?.emit(CUSTOMER_EVENTS.TYPING_START, { sessionId });
    }, [sessionId]);

    const sendTypingStop = useCallback(() => {
        socketRef.current?.emit(CUSTOMER_EVENTS.TYPING_STOP, { sessionId });
    }, [sessionId]);

    const sendBookingAction = useCallback((action, payload) => {
        socketRef.current?.emit(CUSTOMER_EVENTS.BOOKING_ACTION, { sessionId, action, payload });
    }, [sessionId]);

    return { connected, sendMessage, requestAgent, sendTypingStart, sendTypingStop, sendBookingAction };
}

