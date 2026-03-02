import { useState } from 'react';

export default function StatusFlow({ onAction, onClose }) {
    const [method, setMethod] = useState('id'); // 'id' | 'email'
    const [value, setValue] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onAction('status', method === 'id' ? { bookingId: value.trim() } : { email: value.trim() });
        setSubmitted(true);
    };

    return (
        <div className="widget-flow">
            <div className="widget-flow__header">
                <button className="widget-flow__back" onClick={onClose}>← Back</button>
                <span>🔍 Booking Status</span>
            </div>
            <div className="widget-flow__body">
                {!submitted ? (
                    <>
                        <div className="widget-flow__tabs">
                            <button
                                className={`widget-flow__tab${method === 'id' ? ' widget-flow__tab--active' : ''}`}
                                onClick={() => setMethod('id')}
                            >Booking ID</button>
                            <button
                                className={`widget-flow__tab${method === 'email' ? ' widget-flow__tab--active' : ''}`}
                                onClick={() => setMethod('email')}
                            >Email</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <input
                                className="widget-flow__input"
                                type={method === 'email' ? 'email' : 'text'}
                                placeholder={method === 'id' ? 'Enter Booking ID…' : 'Enter your email…'}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                required
                            />
                            <button type="submit" className="widget-flow__btn">🔍 Check Status</button>
                        </form>
                    </>
                ) : (
                    <div className="widget-flow__body--center">
                        <div className="widget-flow__success">🔍</div>
                        <p>Looking up your booking… The status card will appear in the chat.</p>
                        <button className="widget-flow__btn" onClick={onClose}>← Back to chat</button>
                    </div>
                )}
            </div>
        </div>
    );
}
