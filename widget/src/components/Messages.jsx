import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';

export default function Messages({ messages, primaryColor }) {
    const bottomRef = useRef(null);
    const prevLengthRef = useRef(messages.length); // track previous count

    useEffect(() => {
        // Only scroll if a NEW message was added, not on initial load
        if (messages.length > prevLengthRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevLengthRef.current = messages.length;
    }, [messages]);

    return (
        <div className="widget-messages">
            {messages.length === 0 && (
                <div className="widget-messages__empty">
                    <div className="widget-messages__empty-icon">💬</div>
                    <p>No messages yet. Ask us anything!</p>
                </div>
            )}
            {messages.map((msg, i) => (
                <MessageBubble key={msg._id || i} message={msg} primaryColor={primaryColor} />
            ))}
            <div ref={bottomRef} />
        </div>
    );
}