import { useState } from 'react';
import { SERVICES } from '../../../shared/constants.js';


const STEPS = ['service', 'datetime', 'summary', 'done'];

export default function BookingFlow({ onAction, onClose }) {
    const [step, setStep] = useState('service');
    const [data, setData] = useState({ service: '', datetime: '' });

    const handleServiceSelect = (service) => {
        setData((d) => ({ ...d, service }));
        setStep('datetime');
    };

    const handleDateConfirm = (e) => {
        e.preventDefault();
        if (!data.datetime) return;
        setStep('summary');
    };

    const handleConfirm = () => {
        onAction('create', { service: data.service, datetime: data.datetime });
        setStep('done');
    };

    return (
        <div className="widget-flow">
            <div className="widget-flow__header">
                <button className="widget-flow__back" onClick={onClose}>← Back</button>
                <span>📅 Book Appointment</span>
            </div>

            {step === 'service' && (
                <div className="widget-flow__body">
                    <p className="widget-flow__label">What service do you need?</p>
                    <div className="widget-flow__options">
                        {SERVICES.map((s) => (
                            <button key={s} className="widget-flow__option" onClick={() => handleServiceSelect(s)}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 'datetime' && (
                <div className="widget-flow__body">
                    <p className="widget-flow__label">Selected: <strong>{data.service}</strong></p>
                    <p className="widget-flow__label">Pick a date & time:</p>
                    <form onSubmit={handleDateConfirm}>
                        <input
                            type="datetime-local"
                            className="widget-flow__input"
                            value={data.datetime}
                            min={new Date().toISOString().slice(0, 16)}
                            onChange={(e) => setData((d) => ({ ...d, datetime: e.target.value }))}
                            required
                        />
                        <button type="submit" className="widget-flow__btn">Next →</button>
                    </form>
                </div>
            )}

            {step === 'summary' && (
                <div className="widget-flow__body">
                    <p className="widget-flow__label">Confirm your booking:</p>
                    <div className="widget-flow__summary">
                        <div className="widget-flow__summary-row"><span>Service</span><strong>{data.service}</strong></div>
                        <div className="widget-flow__summary-row">
                            <span>Date & Time</span>
                            <strong>{new Date(data.datetime).toLocaleString()}</strong>
                        </div>
                    </div>
                    <div className="widget-flow__actions">
                        <button className="widget-flow__btn widget-flow__btn--secondary" onClick={() => setStep('service')}>Edit</button>
                        <button className="widget-flow__btn" onClick={handleConfirm}>✅ Confirm</button>
                    </div>
                </div>
            )}

            {step === 'done' && (
                <div className="widget-flow__body widget-flow__body--center">
                    <div className="widget-flow__success">✅</div>
                    <p><strong>Booking submitted!</strong> You'll receive a confirmation shortly.</p>
                    <button className="widget-flow__btn" onClick={onClose}>Done</button>
                </div>
            )}
        </div>
    );
}
