import { useState } from 'react';

export default function CancelFlow({ onAction, onClose }) {
    const [step, setStep] = useState('lookup');
    const [bookingId, setBookingId] = useState('');
    const [done, setDone] = useState(false);

    const handleLookup = (e) => {
        e.preventDefault();
        if (!bookingId.trim()) return;
        setStep('confirm');
    };

    const handleConfirm = () => {
        onAction('cancel', { bookingId: bookingId.trim() });
        setDone(true);
    };

    return (
        <div className="widget-flow">
            <div className="widget-flow__header">
                <button className="widget-flow__back" onClick={onClose}>← Back</button>
                <span>❌ Cancel Booking</span>
            </div>
            <div className="widget-flow__body">
                {step === 'lookup' && (
                    <form onSubmit={handleLookup}>
                        <p className="widget-flow__label">Enter your Booking ID to cancel:</p>
                        <input
                            className="widget-flow__input"
                            type="text"
                            placeholder="Booking ID…"
                            value={bookingId}
                            onChange={(e) => setBookingId(e.target.value)}
                            required
                        />
                        <button type="submit" className="widget-flow__btn">Find Booking →</button>
                    </form>
                )}

                {step === 'confirm' && !done && (
                    <div>
                        <div className="widget-flow__warning">
                            ⚠️ <strong>Are you sure?</strong><br />
                            Booking <code>{bookingId.toUpperCase()}</code> will be permanently cancelled.
                        </div>
                        <div className="widget-flow__actions">
                            <button className="widget-flow__btn widget-flow__btn--secondary" onClick={() => setStep('lookup')}>
                                No, Go Back
                            </button>
                            <button className="widget-flow__btn widget-flow__btn--danger" onClick={handleConfirm}>
                                ❌ Yes, Cancel
                            </button>
                        </div>
                    </div>
                )}

                {done && (
                    <div className="widget-flow__body--center">
                        <div className="widget-flow__success">✅</div>
                        <p>Your booking has been <strong>cancelled</strong>. We're sorry to see you go!</p>
                        <button className="widget-flow__btn" onClick={onClose}>← Back to chat</button>
                    </div>
                )}
            </div>
        </div>
    );
}
