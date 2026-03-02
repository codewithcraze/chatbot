import { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../store/agentStore.js';
import { useConversationStore } from '../store/conversationStore.js';
import { useSession } from '../hooks/useApi.js';
import { getSocket } from '../hooks/useSocket.js';
import { useCannedResponses } from '../hooks/useApi.js';
import { AGENT_EVENTS, SENDER_TYPE } from '../../../shared/constants.js';
import { formatTime } from '../../../shared/utils.js';

const MSG_STYLE = {
    customer: 'self-start bg-slate-700/60 border border-slate-600 text-slate-200 rounded-bl-sm',
    agent: 'self-end   bg-emerald-500/15 border border-emerald-500/30 text-slate-200 rounded-br-sm',
    bot: 'self-start bg-slate-700/40 border border-slate-700 text-slate-400 rounded-bl-sm',
    system: 'self-center bg-transparent text-slate-500 text-xs border-none text-center',
};


export default function ChatView({ sessionId }) {
    const { currentAgent } = useAgentStore();
    const { conversations, addMessage } = useConversationStore();
    const [input, setInput] = useState('');
    const [showCanned, setShowCanned] = useState(false);
    const [cannedSearch, setCannedSearch] = useState('');
    const bottomRef = useRef(null);
    const { data: cannedData } = useCannedResponses(currentAgent?.orgId);

    // Get full session messages (from store or API)
    const conv = conversations.find((c) => c._id === sessionId);
    const messages = conv?.messages || [];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || !currentAgent) return;
        const socket = getSocket();
        if (socket) {
            const localId = `local_${Date.now()}`;
            socket.emit(AGENT_EVENTS.SEND_MESSAGE, {
                sessionId,
                content: text,
                agentId: currentAgent._id,
                agentName: currentAgent.name,
            });
            // Optimistic UI – will be updated by MESSAGE_ACK
            addMessage(sessionId, {
                localId,
                sender: SENDER_TYPE.AGENT,
                content: text,
                timestamp: new Date(),
                status: 'sent',
            });
        }

        setInput('');
        setShowCanned(false);
    };

    const handleResolve = () => {
        const socket = getSocket();
        if (socket) {
            socket.emit(AGENT_EVENTS.RESOLVE_CHAT, {
                sessionId,
                agentId: currentAgent?._id,
                orgId: currentAgent?.orgId,
            });
        }
    };

    const handleTyping = (typing) => {
        const socket = getSocket();
        if (!socket) return;
        socket.emit(typing ? AGENT_EVENTS.TYPING_START : AGENT_EVENTS.TYPING_STOP, { sessionId });
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        if (val.startsWith('/')) {
            setShowCanned(true);
            setCannedSearch(val.slice(1).toLowerCase());
        } else {
            setShowCanned(false);
            handleTyping(val.length > 0);
        }
    };

    const filteredCanned = (cannedData || []).filter(
        (cr) => cr.shortcut.includes(cannedSearch) || cr.category?.includes(cannedSearch)
    );

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
                <div>
                    <div className="font-semibold text-slate-200">{conv?.customer?.name || 'Guest'}</div>
                    <div className="text-xs text-slate-500">{conv?.customer?.email} · {conv?.status}</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleResolve} className="btn-secondary text-xs">
                        ✅ Resolve
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-3">
                {messages.map((msg, i) => (
                    <div
                        key={msg._id || msg.localId || i}
                        className={`flex flex-col max-w-[70%] ${msg.sender === 'agent'
                                ? 'self-end items-end'
                                : msg.sender === 'system'
                                    ? 'self-center items-center w-full'
                                    : 'self-start items-start'
                            }`}
                    >
                        {msg.sender !== 'system' && (
                            <span className="text-[10px] text-slate-600 mb-0.5 px-1 capitalize">{msg.sender}</span>
                        )}
                        <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed border ${MSG_STYLE[msg.sender] || MSG_STYLE.bot}`}>
                            {msg.content}
                        </div>
                        {msg.sender !== 'system' && (
                            <span className="text-[10px] text-slate-600 mt-0.5 px-1">{formatTime(msg.timestamp)}</span>
                        )}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Canned response picker */}
            {showCanned && filteredCanned.length > 0 && (
                <div className="mx-4 mb-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                    <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase border-b border-slate-700">Canned Responses</div>
                    {filteredCanned.slice(0, 5).map((cr) => (
                        <button
                            key={cr._id}
                            className="w-full text-left px-3 py-2 hover:bg-slate-700 transition-colors text-sm text-slate-300"
                            onClick={() => { setInput(cr.message); setShowCanned(false); }}
                        >
                            <span className="text-primary-400 font-mono">/{cr.shortcut}</span>
                            <span className="text-slate-500 ml-2 text-xs">{cr.message.slice(0, 60)}…</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Input bar */}
            <div className="p-3 border-t border-slate-800 flex gap-2 items-end flex-shrink-0">
                <textarea
                    className="input-field flex-1 resize-none min-h-[40px] max-h-[120px]"
                    rows={1}
                    placeholder="Type a reply… (/ for canned responses)"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    onBlur={() => handleTyping(false)}
                />
                <button
                    className="btn-primary py-2.5 px-4 flex-shrink-0"
                    onClick={handleSend}
                    disabled={!input.trim()}
                >
                    ↗ Send
                </button>
            </div>
        </div>
    );
}
