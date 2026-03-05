export default function Bubble({ unreadCount, onClick, primaryColor }) {
    return (
        <button
            className={`widget-bubble${unreadCount > 0 ? ' widget-bubble--pulse' : ''}`}
            onClick={onClick}
            aria-label="Open chat"

            style={{ background: primaryColor, left: '6px', right: '8px', top: "5px" }}
        >
            {unreadCount > 0 ? (
                <span className="widget-bubble__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            ) : null}
            <img src="../travomint.png" alt="Chat" height="52" width="52" />
        </button>
    );
}
