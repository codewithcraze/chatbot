import { useState } from 'react';
import { SERVICES } from '../../../shared/constants.js';


export default function BookingFlow({ onAction, onClose }) {
    const [step, setStep] = useState('service');
    const [data, setData] = useState({ service: '', datetime: '' });

    const handleServiceSelect = (service) => {
        setData((d) => ({ ...d, service }));
    };




    // Perform Action and all. server communication in one step for simplicity, but can be split into separate "Confirm Booking" step if needed.
    const handleConfirm = () => {
        onAction('create', { service: data.service, datetime: data.datetime });
        setStep('done');
    };

    return (
        <div className="widget-flow">
            <div className="widget-flow__header" style={{ display: 'flex', justifyContent: "space-between" }}>
                <span>Create New Booking</span>
                <button className="widget-flow__back" onClick={onClose}>Back</button>
            </div>

            {step === 'service' && (
                <div className="widget-flow__body">
                    <p className="widget-flow__label">What you want to book?</p>
                    <div className="widget-flow__options">
                        {SERVICES.map((s) => (
                            <button key={s} className="widget-flow__option" onClick={() => handleServiceSelect(s)}>
                                {s}
                            </button>
                        ))}
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
