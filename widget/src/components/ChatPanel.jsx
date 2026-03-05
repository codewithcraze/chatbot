import Header from './Header.jsx';
import QuickPills from './QuickPills.jsx';
import Messages from './Messages.jsx';
import InputBar from './InputBar.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import BookingFlow from '../flows/BookingFlow.jsx';
import StatusFlow from '../flows/StatusFlow.jsx';
import ModifyFlow from '../flows/ModifyFlow.jsx';
import CancelFlow from '../flows/CancelFlow.jsx';

export default function ChatPanel({
    messages, isAgentTyping, agentInfo, queueInfo, activeFlow, setActiveFlow,
    isConnectingAgent, sessionResolved, connected,
    onClose, onSendMessage, onConnectAgent, onBookingAction,
    onTypingStart, onTypingStop, primaryColor,
}) {
    const renderFlow = () => {
        if (activeFlow === 'book') return <BookingFlow onAction={onBookingAction} onClose={() => setActiveFlow(null)} />;
        if (activeFlow === 'status') return <StatusFlow onAction={onBookingAction} onClose={() => setActiveFlow(null)} />;
        if (activeFlow === 'modify') return <ModifyFlow onAction={onBookingAction} onClose={() => setActiveFlow(null)} />;
        if (activeFlow === 'cancel') return <CancelFlow onAction={onBookingAction} onClose={() => setActiveFlow(null)} />;
        return null;
    };

    const queueBanner = queueInfo && !agentInfo ? (
        <div className="widget-queue-banner">
            🕐 You're #<strong>{queueInfo.position}</strong> in queue — estimated wait: <strong>{queueInfo.estimatedWait}</strong>
        </div>
    ) : null;

    const resolvedBanner = sessionResolved ? (
        <div className="widget-resolved-banner">✅ Chat resolved. Start a new conversation anytime.</div>
    ) : null;

    return (
        <div className="widget-panel widget-panel--open">
            <Header
                agentInfo={agentInfo}
                connected={connected}
                isConnectingAgent={isConnectingAgent}
                onConnectAgent={onConnectAgent}
                onClose={onClose}
                primaryColor={primaryColor}
            />

            {queueBanner}
            {resolvedBanner}

            {activeFlow ? (
                <div className="widget-flow-container">
                    {renderFlow()}
                </div>
            ) : (
                <>
                    <Messages messages={messages} primaryColor={primaryColor} />
                    <QuickPills onSelect={setActiveFlow} onConnectAgent={onConnectAgent} />
                    {isAgentTyping && <TypingIndicator />}
                </>
            )}

            {activeFlow === null && (<InputBar
                onSend={onSendMessage}
                onTypingStart={onTypingStart}
                onTypingStop={onTypingStop}
                disabled={sessionResolved || activeFlow !== null}
                placeholder={sessionResolved ? 'Chat resolved' : 'Type a message…'}
            />)}

        </div>
    );
}
