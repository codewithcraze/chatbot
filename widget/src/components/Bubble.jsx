export default function Bubble({ unreadCount, onClick, primaryColor }) {
    return (
        <button
            className={`widget-bubble${unreadCount > 0 ? ' widget-bubble--pulse' : ''}`}
            onClick={onClick}
            aria-label="Open chat"
            style={{ background: primaryColor }}
        >
            {unreadCount > 0 ? (
                <span className="widget-bubble__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            ) : null}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        </button>
    );
}
