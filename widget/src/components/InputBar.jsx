import { useRef, useState } from 'react';
import { debounce } from '../../../shared/utils.js';

export default function InputBar({ onSend, onTypingStart, onTypingStop, disabled, placeholder }) {
    const [value, setValue] = useState('');
    const stopTypingRef = useRef(null);

    const triggerTypingStop = debounce(() => {
        onTypingStop?.();
    }, 1500);

    const handleChange = (e) => {
        setValue(e.target.value);
        onTypingStart?.();
        triggerTypingStop();
    };

    const handleSend = () => {
        const trimmed = value.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setValue('');
        onTypingStop?.();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="widget-input">
            <textarea
                className="widget-input__textarea"
                rows={1}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || 'Type a message…'}
                disabled={disabled}
            />
            <button
                className="widget-input__send"
                onClick={handleSend}
                disabled={!value.trim() || disabled}
                aria-label="Send message"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
            </button>
        </div>
    );
}
