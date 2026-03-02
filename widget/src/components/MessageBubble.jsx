import { formatTime } from '../../../shared/utils.js';

const STATUS_TICKS = { sent: '✓', delivered: '✓✓', read: '✓✓' };

export default function MessageBubble({ message, primaryColor }) {
    const { sender, type, content, timestamp, status, bookingData } = message;

    if (type === 'system' || sender === 'system') {
        return (
            <div className="widget-msg widget-msg--system">
                <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
        );
    }

    if (type === 'booking_card' && bookingData) {
        const b = bookingData.booking || {};
        return (
            <div className="widget-msg widget-msg--bot">
                <div className="widget-booking-card">
                    <div className="widget-booking-card__header">📋 Booking {bookingData.action === 'cancel' ? 'Cancelled' : bookingData.action === 'modify' ? 'Modified' : 'Confirmed'}</div>
                    <div className="widget-booking-card__row"><span>Service</span><strong>{b.service || '—'}</strong></div>
                    <div className="widget-booking-card__row"><span>Date</span><strong>{b.datetime ? new Date(b.datetime).toLocaleString() : '—'}</strong></div>
                    <div className="widget-booking-card__row"><span>Status</span><strong className={`widget-booking-status widget-booking-status--${b.status}`}>{b.status}</strong></div>
                    {b._id && <div className="widget-booking-card__id">ID: {String(b._id).slice(-8).toUpperCase()}</div>}
                </div>
                <div className="widget-msg__time">{formatTime(timestamp)}</div>
            </div>
        );
    }

    const isCustomer = sender === 'customer';
    const isAgent = sender === 'agent';

    return (
        <div className={`widget-msg widget-msg--${isCustomer ? 'customer' : isAgent ? 'agent' : 'bot'}`}>
            <div
                className="widget-msg__bubble"
                style={isCustomer ? { background: primaryColor } : undefined}
            >
                <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
            <div className="widget-msg__time">
                {formatTime(timestamp)}
                {isCustomer && status && (
                    <span className={`widget-msg__tick${status === 'read' ? ' widget-msg__tick--read' : ''}`}>
                        {' '}{STATUS_TICKS[status] || ''}
                    </span>
                )}
            </div>
        </div>
    );
}
