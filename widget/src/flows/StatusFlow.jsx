import { useState, useEffect, useRef } from 'react';

const STEPS = ['bookingId', 'lastName', 'result'];

function TypingIndicator() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px', background: '#f0f0f0', borderRadius: 18, borderBottomLeftRadius: 4, width: 'fit-content' }}>
            {[0, 1, 2].map(i => (
                <span key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#aaa',
                    animation: 'bounce 1.2s infinite',
                    animationDelay: `${i * 0.2}s`
                }} />
            ))}
        </div>
    );
}

function BotMessage({ text, isNew }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 8,
            animation: isNew ? 'slideIn 0.3s ease' : 'none'
        }}>
            <div style={{
                background: '#f0f0f0', color: '#1a1a1a',
                padding: '10px 14px', borderRadius: 18, borderBottomLeftRadius: 4,
                maxWidth: '75%', fontSize: 14, lineHeight: 1.5,
             
            }}>{text}</div>
        </div>
    );
}

function UserMessage({ text }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'slideIn 0.3s ease' }}>
            <div style={{
                    background: '#f0f0f0', color: '#1a1a1a',padding: '10px 14px',
                borderRadius: 18, borderBottomRightRadius: 4,
                maxWidth: '75%', fontSize: 14, lineHeight: 1.5,
                
            }}>{text}</div>
        </div>
    );
}

export default function StatusFlow({ onAction, onClose }) {
    const [messages, setMessages] = useState([]);
    const [step, setStep] = useState('bookingId');
    const [bookingId, setBookingId] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [done, setDone] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    const botSay = (text, delay = 800) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, { from: 'bot', text, id: Date.now() }]);
        }, delay);
    };

    useEffect(() => {
        botSay("Hi there! 👋 I'll help you check your booking status. Could you share your Booking ID?", 600);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (!done) inputRef.current?.focus();
    }, [messages, isTyping]);

    const handleSend = () => {
        const val = inputValue.trim();
        if (!val) return;

        setMessages(prev => [...prev, { from: 'user', text: val, id: Date.now() }]);
        setInputValue('');

        if (step === 'bookingId') {
            setBookingId(val);
            setStep('lastName');
            botSay(`Got it! Booking **${val}** noted. Now, what's the **last name** on the booking?`);
        } else if (step === 'lastName') {
            setStep('result');
            setDone(true);
            botSay(`Perfect! Let me pull up the details for booking **${bookingId}** under the name **${val}**…`, 600);
            setTimeout(() => {
                setMessages(prev => [...prev, { from: 'bot', text: `✅ All set! Your booking status will appear in the chat shortly.`, id: Date.now() + 1 }]);
            }, 1800);
            onAction?.('status', { bookingId, lastName: val });
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <>
            <style>{`
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-5px); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="widget-flow">
                {/* Header */}
                <div className="widget-flow__header" style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
                    <span>Booking Status</span>
                    <button className="widget-flow__back" onClick={onClose}>Back</button>
                </div>

                {/* Messages */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '16px 12px',
                    display: 'flex', flexDirection: 'column', gap: 10
                }}>
                    {messages.map((m, i) =>
                        m.from === 'bot'
                            ? <BotMessage key={m.id} text={m.text} isNew={i === messages.length - 1} />
                            : <UserMessage key={m.id} text={m.text} />
                    )}
                    {isTyping && <TypingIndicator />}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                {!done && (
                    <div style={{
                        padding: '10px 12px',
                        borderTop: '1px solid #f0f0f0',
                        display: 'flex', gap: 8, alignItems: 'center'
                    }}>
                         <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder={step === 'bookingId' ? 'e.g. BK-20481…' : 'e.g. Smith…'}
                            className="widget-input__textarea"
                            onFocus={e => e.target.style.borderColor = '#ff5100'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <button
                            onClick={handleSend}
                             className="widget-input__send"
                            disabled={!inputValue.trim()}
                             aria-label="Send message"
                           
                        > <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg></button>
                    </div>
                )}
            </div>
        </>
    );
}