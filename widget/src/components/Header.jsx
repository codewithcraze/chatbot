export default function Header({ agentInfo, connected, isConnectingAgent, onConnectAgent, onClose, primaryColor }) {
    return (
        <div className="widget-header" style={{ background: primaryColor }}>
            <div className="widget-header__left">
                <div className="widget-header__avatar">
                    {agentInfo?.avatar
                        ? <img src={agentInfo.avatar} alt={agentInfo.agentName} />
                        : <span>🤖</span>}
                </div>
                <div className="widget-header__info">
                    <div className="widget-header__name">
                        {agentInfo ? agentInfo.agentName : 'Support Assistant'}
                    </div>
                    <div className="widget-header__status">
                        <span className={`widget-status-dot${connected ? ' widget-status-dot--online' : ''}`} />
                        {connected ? 'Online' : 'Connecting…'}
                    </div>
                </div>
            </div>
            <div className="widget-header__actions">
                {/* {!agentInfo && (
                    <button
                        className="widget-header__agent-btn"
                        onClick={onConnectAgent}
                        disabled={isConnectingAgent}
                    >
                        {isConnectingAgent ? (
                            <><span className="widget-spinner" /> Connecting…</>
                        ) : (
                            '👤 Live Agent'
                        )}
                    </button>
                )} */}
                <button className="widget-header__close" onClick={onClose} aria-label="Minimize chat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
