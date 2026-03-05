import { useChat } from './hooks/useChat.js';
import { useSocket } from './hooks/useSocket.js';
import { generateId } from '../../shared/utils.js';
import Bubble from './components/Bubble.jsx';
import ChatPanel from './components/ChatPanel.jsx';


export default function App({ orgId, primaryColor }) {
    const chat = useChat();
    const socket = useSocket(chat.sessionId, orgId, {
        onSessionHistory: chat.onSessionHistory,
        onMessage: chat.onMessage,
        onAck: chat.onAck,
        onAgentJoined: chat.onAgentJoined,
        onAgentTyping: chat.onAgentTyping,
        onBookingConfirmed: chat.onBookingConfirmed,
        onQueuePosition: chat.onQueuePosition,
        onResolved: chat.onResolved,
    });

    const handleConnectAgent = () => {
        chat.setIsConnectingAgent(true);
        socket.requestAgent('Customer requested live agent');
    };

    const handleSendMessage = (content) => {
        if (!content.trim()) return;
        const localId = generateId();
        // Add optimistically – will be ACKed with the persisted _id from server
        chat.addMessage({ sender: 'customer', type: 'text', content, localId, timestamp: new Date() });
        socket.sendMessage(content, 'text', localId);
    };


    const handleBookingAction = (action, payload) => {
        socket.sendBookingAction(action, payload);
    };

    return (
        <>
            {chat.isExpanded ? (
                <ChatPanel
                    messages={chat.messages}
                    isAgentTyping={chat.isAgentTyping}
                    agentInfo={chat.agentInfo}
                    queueInfo={chat.queueInfo}
                    activeFlow={chat.activeFlow}
                    setActiveFlow={chat.setActiveFlow}
                    isConnectingAgent={chat.isConnectingAgent}
                    sessionResolved={chat.sessionResolved}
                    connected={socket.connected}
                    onClose={chat.collapse}
                    onSendMessage={handleSendMessage}
                    onConnectAgent={handleConnectAgent}
                    onBookingAction={handleBookingAction}
                    onTypingStart={socket.sendTypingStart}
                    onTypingStop={socket.sendTypingStop}
                    primaryColor={primaryColor}
                />
            ) : (
                <Bubble
                    unreadCount={chat.unreadCount}
                    onClick={chat.expand}
                    primaryColor={primaryColor}
                />
            )}
        </>
    );
}
