import { useConversationStore } from '../store/conversationStore.js';
import { formatRelativeTime, truncate } from '../../../shared/utils.js';

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'waiting', label: 'Waiting' },
    { id: 'resolved', label: 'Resolved' },
];

const STATUS_BADGE = {
    bot: 'badge-bot',
    waiting: 'badge-waiting',
    live: 'badge-live',
    resolved: 'badge-resolved',
};

export default function LeftSidebar() {
    const {
        filter, setFilter, search, setSearch,
        activeSessionId, setActiveSession, unreadCounts, getFiltered,
    } = useConversationStore();

    const conversations = getFiltered();

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Search */}
            <div className="p-3 border-b border-slate-800">
                <input
                    className="input-field"
                    placeholder="🔍 Search conversations…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`flex-1 py-2.5 text-xs font-medium transition-all border-b-2 ${filter === tab.id
                                ? 'border-primary-500 text-primary-400'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {conversations.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-sm gap-2">
                        <span className="text-2xl">💬</span>
                        <span>No conversations</span>
                    </div>
                )}
                {conversations.map((conv) => {
                    const isActive = conv._id === activeSessionId;
                    const unread = unreadCounts[conv._id] || 0;
                    const lastMsg = conv.messages?.at(-1);
                    return (
                        <button
                            key={conv._id}
                            onClick={() => setActiveSession(conv._id)}
                            className={`w-full text-left px-3 py-3 border-b border-slate-800/60 transition-all glass-hover ${isActive ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : 'border-l-2 border-l-transparent'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-300 flex-shrink-0">
                                    {conv.customer?.name?.[0]?.toUpperCase() || 'G'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm text-slate-200 truncate">
                                            {conv.customer?.name || 'Guest'}
                                        </span>
                                        <span className="text-[10px] text-slate-600 flex-shrink-0 ml-1">
                                            {conv.updatedAt ? formatRelativeTime(conv.updatedAt) : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-xs text-slate-500 truncate">
                                            {truncate(lastMsg?.content || 'No messages yet', 40)}
                                        </span>
                                        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                            {unread > 0 && (
                                                <span className="bg-primary-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                                    {unread}
                                                </span>
                                            )}
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[conv.status] || 'badge-offline'}`}>
                                                {conv.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
