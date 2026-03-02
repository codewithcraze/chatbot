import { useState } from 'react';
import { SERVICES } from '../../../shared/constants.js';

export default function ModifyFlow({ onAction, onClose }) {
    const [step, setStep] = useState('lookup');
    const [bookingId, setBookingId] = useState('');
    const [service, setService] = useState('');
    const [datetime, setDatetime] = useState('');
    const [done, setDone] = useState(false);

    const handleLookup = (e) => {
        e.preventDefault();
        if (!bookingId.trim()) return;
        setStep('edit');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!service && !datetime) return;
        onAction('modify', { bookingId: bookingId.trim(), service: service || undefined, datetime: datetime || undefined });
        setDone(true);
    };

    return (
        <div className="widget-flow">
            <div className="widget-flow__header">
                <button className="widget-flow__back" onClick={onClose}>← Back</button>
                <span>✏️ Modify Booking</span>
            </div>
            <div className="widget-flow__body">
                {step === 'lookup' && (
                    <form onSubmit={handleLookup}>
                        <p className="widget-flow__label">Enter your Booking ID:</p>
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

                {step === 'edit' && !done && (
                    <form onSubmit={handleSubmit}>
                        <p className="widget-flow__label">Update fields (leave blank to keep current):</p>
                        <p className="widget-flow__sublabel">New Service:</p>
                        <select
                            className="widget-flow__input"
                            value={service}
                            onChange={(e) => setService(e.target.value)}
                        >
                            <option value="">— Keep current —</option>
                            {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <p className="widget-flow__sublabel">New Date & Time:</p>
                        <input
                            type="datetime-local"
                            className="widget-flow__input"
                            value={datetime}
                            min={new Date().toISOString().slice(0, 16)}
                            onChange={(e) => setDatetime(e.target.value)}
                        />
                        <div className="widget-flow__actions">
                            <button type="button" className="widget-flow__btn widget-flow__btn--secondary" onClick={() => setStep('lookup')}>← Back</button>
                            <button type="submit" className="widget-flow__btn">✏️ Save Changes</button>
                        </div>
                    </form>
                )}

                {done && (
                    <div className="widget-flow__body--center">
                        <div className="widget-flow__success">✅</div>
                        <p><strong>Booking updated!</strong> The changes will appear in the chat.</p>
                        <button className="widget-flow__btn" onClick={onClose}>← Back to chat</button>
                    </div>
                )}
            </div>
        </div>
    );
}
