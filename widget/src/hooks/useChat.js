import { useState, useCallback, useRef } from 'react';
import { generateId } from '../../../shared/utils.js';


const INITIAL_FLOW = null; // null | 'book' | 'status' | 'modify' | 'cancel'

/**
 * Central state for the widget chat panel.
 */
export function useChat() {
    const [messages, setMessages] = useState([]);
    const [isAgentTyping, setIsAgentTyping] = useState(false);
    const [agentInfo, setAgentInfo] = useState(null); // { agentName, avatar }

    console.log(agentInfo)
    const [queueInfo, setQueueInfo] = useState(null); // { position, estimatedWait }
    const [activeFlow, setActiveFlow] = useState(INITIAL_FLOW);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isConnectingAgent, setIsConnectingAgent] = useState(false);
    const [sessionResolved, setSessionResolved] = useState(false);

    // Stable sessionId persisted in localStorage (survives tab close + browser restart).
    // Switching to localStorage from sessionStorage means the user always returns
    // to the same conversation instead of starting fresh every time.
    const sessionId = useRef(
        (() => {
            const stored = localStorage.getItem('chat_session_id');
            if (stored) return stored;
            const id = generateId(24);
            localStorage.setItem('chat_session_id', id);
            return id;
        })()
    ).current;


    /** Add a message to the local feed. Returns the localId used. */
    const addMessage = useCallback((msg) => {
        const localId = msg.localId || generateId();
        setMessages((prev) => [
            ...prev,
            { ...msg, localId, _id: msg._id || localId, localTimestamp: Date.now() },
        ]);
        if (!isExpanded) {
            setUnreadCount((c) => c + 1);
        }
        return localId;
    }, [isExpanded]);


    /** Handle SESSION_HISTORY – restores full chat on page refresh / reconnect */
    const onSessionHistory = useCallback(({ messages: history, status, agentInfo: agent }) => {
        if (!history?.length) return;
        // Replace all local messages with the authoritative server history
        setMessages(
            history.map((m) => ({
                ...m,
                _id: String(m._id),
                localTimestamp: new Date(m.timestamp).getTime(),
            }))
        );
        // Restore session state
        if (status === 'live' && agent) {
            setAgentInfo(agent);
            setIsConnectingAgent(false);
        } else if (status === 'waiting') {
            setIsConnectingAgent(true);
        } else if (status === 'resolved') {
            setSessionResolved(true);
        }
    }, []);

    /** Handle incoming server message (from bot or agent – but NOT our own customer messages) */
    const onMessage = useCallback((msg) => {
        addMessage(msg);
        setIsAgentTyping(false);
    }, [addMessage]);

    /** Handle MESSAGE_ACK – update the status tick on our optimistic message */
    const onAck = useCallback(({ localId, _id, status }) => {
        setMessages((prev) =>
            prev.map((m) =>
                m.localId === localId || m._id === localId
                    ? { ...m, _id, status }
                    : m
            )
        );
    }, []);


    /** Handle agent joined event */
    const onAgentJoined = useCallback((data) => {
        setAgentInfo(data);
        setIsConnectingAgent(false);
        setQueueInfo(null);
        addMessage({
            sender: 'system',
            type: 'system',
            content: `You're now connected to **${data.agentName}** 👋`,
            timestamp: new Date(),
        });
    }, [addMessage]);

    /** Handle agent typing */
    const onAgentTyping = useCallback(({ isTyping }) => {
        setIsAgentTyping(isTyping);
    }, []);

    /** Handle booking confirmed */
    const onBookingConfirmed = useCallback((data) => {
        addMessage({
            sender: 'bot',
            type: 'booking_card',
            content: JSON.stringify(data.booking),
            timestamp: new Date(),
            bookingData: data,
        });
        setActiveFlow(null);
    }, [addMessage]);

    /** Handle queue position */
    const onQueuePosition = useCallback((data) => {
        setQueueInfo(data);
        setIsConnectingAgent(false);
    }, []);

    /** Handle session resolved */
    const onResolved = useCallback(() => {
        setSessionResolved(true);
        addMessage({
            sender: 'system',
            type: 'system',
            content: "This chat has been resolved. Thank you! 😊",
            timestamp: new Date(),
        });
    }, [addMessage]);

    const expand = useCallback(() => {
        setIsExpanded(true);
        setUnreadCount(0);
    }, []);

    const collapse = useCallback(() => {
        setIsExpanded(false);
    }, []);

    return {
        sessionId,
        messages,
        isAgentTyping,
        agentInfo,
        queueInfo,
        activeFlow,
        setActiveFlow,
        unreadCount,
        isExpanded,
        isConnectingAgent,
        setIsConnectingAgent,
        sessionResolved,
        // event handlers for useSocket
        onSessionHistory,
        onMessage,
        onAck,
        onAgentJoined,
        onAgentTyping,
        onBookingConfirmed,
        onQueuePosition,
        onResolved,
        // expand/collapse
        expand,
        collapse,
        addMessage,
    };


}
