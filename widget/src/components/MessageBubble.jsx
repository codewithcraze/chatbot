import { formatTime } from '../../../shared/utils.js';
import { useState} from 'react';
import { AIRLINE_COLORS } from '../../../shared/constants.js';


const STATUS_TICKS = { sent: '✓', delivered: '✓✓', read: '✓✓' };

export default function MessageBubble({ message, primaryColor }) {
    const { sender, type, content, timestamp, status, bookingData, metadata } = message;
    // console.log(message);

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


       if (type === 'query') {
       
        return (
            <div className="widget-msg widget-msg--bot">
                <div className="widget-booking-card">
                    <div className="widget-booking-card__header">{content}</div>
                    <div className="widget-booking-card__row"><span>Name</span><strong>{metadata?.name || '—'}</strong></div>
                    <div className="widget-booking-card__row"><span>Email</span><strong>{metadata.email || '—'}</strong></div>
                    <div className="widget-booking-card__row"><span>Phone Number</span><strong>{metadata.phone || '—'}</strong></div>
                </div>
                <div className="widget-msg__time">{formatTime(timestamp)}</div>
            </div>
        );
    }

    if (type === 'links' && metadata?.links?.length) {
        return (
            <div className="widget-msg widget-msg--bot">
                <div className="widget-links-card">
                    <div className="widget-links-card__content">{content}</div>
                    <div className="widget-links-card__grid">
                        {metadata.links.map((link, i) => (
                            <div>
                                <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="widget-links-card__link"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff5a1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M14 3l7 7-7 7"></path>
                                        <path d="M21 10H10a7 7 0 0 0-7 7"></path>
                                    </svg>
                                    <span>{link.label}</span>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="widget-msg__time">{formatTime(timestamp)}</div>
            </div>
        );
    }


    if(type === 'flight_options' && metadata?.flightOptions?.length) {
        return (
            <div className="widget-msg widget-msg--bot" >
                <div className="widget-links-card" style={{margin: "0", padding: "0px", maxWidth: "none", minWidth: "300px"}}>
                    <div className="widget-booking-card__header" style={{color: "black"}}>{content}</div>
                    <div className="widget-flight-options-card__grid">
                        {metadata.flightOptions.map((option, i) => (
                            <FlightCard key={i} option={option} index={i} onBook={(opt) => {
                                window.open(opt.bookingLink, "_blank");
                            }} />
                        ))}
                    </div>
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



function FlightCard({ option, index, onBook }) {
  const [hovered, setHovered] = useState(false);
  const colors = AIRLINE_COLORS[option.code] || { from: "#333", to: "#111" };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        border: hovered ? "1.5px solid #ff5100" : "1.5px solid #efefef",
        boxShadow: hovered ? "0 8px 32px rgba(255,81,0,0.10)" : "0 2px 12px rgba(0,0,0,0.06)",
        transition: "all 0.22s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        animation: `fadeSlideIn 0.35s ease both`,
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* Airline Header */}
      <div style={{
        background: `linear-gradient(135deg, rgb(241, 91, 47) )`,
        padding: "2px 2px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
          {/* <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 13, color: "#fff", letterSpacing: "0.04em",
          }}>{option.code}</div> */}
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 11 }}>{option.airline}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{option.flightNumber}</div>
          </div>
        </div>
        {/* <div style={{
          background: "rgba(255,255,255,0.15)",
          borderRadius: 20, padding: "3px 10px",
          color: "#fff", fontSize: 11, fontWeight: 600,
        }}>{option.stops}</div> */}
      </div>

      {/* Flight Route */}
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Depart */}
          <div style={{ textAlign: "center", minWidth: 100 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#111", lineHeight: 1 }}>{option.departure.split("T")[0]}</div>
            <div style={{ fontSize: 11, color: "#111",  fontWeight: 800, lineHeight: 1 }}>{option.departure.split("T")[1].slice(0, 5)}</div>
            <div style={{ fontSize: 10, color: "#aaa", marginTop: 3, fontWeight: 500 }}>DEPART</div>
          </div>

          {/* Line + duration */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 10px" }}>
            <div style={{ fontSize: 10, color: "#ff5100", fontWeight: 700, marginBottom: 4 }}>{option.duration}</div>
            <div style={{ width: "100%", position: "relative", display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1, height: 1.5, background: "linear-gradient(90deg, #e0e0e0, #ff5100, #e0e0e0)" }} />
              <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 8 }}>✈</span>
            </div>
          </div>

          {/* Arrive */}
          <div style={{ textAlign: "center", minWidth: 100 }}>
           <div style={{ fontSize: 11, fontWeight: 800, color: "#111", lineHeight: 1 }}>{option.arrival.split("T")[0]}</div>
            <div style={{ fontSize: 11, color: "#111",  fontWeight: 800, lineHeight: 1 }}>{option.arrival.split("T")[1].slice(0, 5)}</div>
            <div style={{ fontSize: 10, color: "#aaa", marginTop: 3, fontWeight: 500 }}>ARRIVE</div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 6, fontSize: 11, color: "#999", fontWeight: 500 }}>{option.datetime}</div>
      </div>

      {/* Footer: Price + Book Now */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px 14px", marginTop: 4,
        borderTop: "1px solid #f5f5f5",
      }}>
        <div>
          <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Grand Total</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111", lineHeight: 1.2 }}>{option.price}</div>
          {/* <div style={{ fontSize: 10, color: "#bbb" }}>per person</div> */}
        </div>

        <button
          onClick={() => onBook(option)}
          style={{
            background: hovered ? "#ff5100" : "#fff",
            color: hovered ? "#fff" : "#ff5100",
            border: "2px solid #ff5100",
            borderRadius: 12,
            padding: "5px 10px",
            fontWeight: 700,
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
            letterSpacing: "0.02em",
          }}
        >
          Book Now →
        </button>
      </div>
    </div>
  );
}