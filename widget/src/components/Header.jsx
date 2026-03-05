export default function Header({ agentInfo, connected, isConnectingAgent, onConnectAgent, onClose, primaryColor }) {
 
    
    console.log(agentInfo, connected, isConnectingAgent);
    return (
        <div className="widget-header" style={{ background: primaryColor }}>
            <div className="widget-header__left">
                <div className="widget-header__avatar">
                    {agentInfo?.avatar
                        ? <img src={agentInfo.avatar} alt={agentInfo.agentName} />
                        : <span style={{ marginTop: "2px" }}><img src="../travomint.png" alt="logo" height="60" width="52" /></span>}
                </div>
                <div className="widget-header__info">
                    <div className="widget-header__name">
                        {agentInfo ? agentInfo.agentName : 'Travomint'}
                    </div>
                    <div className="widget-header__status">
                        <span className={`widget-status-dot${connected ? ' widget-status-dot--online' : ''}`} />
                        {connected ? 'For your support' : 'Connecting…'}
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
}
