import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';

export default function Messages({ messages, primaryColor }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
