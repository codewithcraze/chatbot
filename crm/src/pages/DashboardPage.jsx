import { useAgentStore } from '../store/agentStore.js';
import { useConversationStore } from '../store/conversationStore.js';
import { useSessions, useBookings } from '../hooks/useApi.js';

function MetricCard({ icon, label, value, sub, colorClass = 'text-primary-400' }) {
    return (
        <div className="metric-card animate-fade-in">
            <div className="flex items-center justify-between">
                <span className="text-2xl">{icon}</span>
                <span className={`text-3xl font-bold ${colorClass}`}>{value}</span>
            </div>
            <div>
                <div className="font-semibold text-slate-300 text-sm">{label}</div>
                {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { currentAgent } = useAgentStore();
    const { conversations } = useConversationStore();
    const orgId = currentAgent?.orgId || 'demo_org_1';
    console.log(orgId);

    const activeChats = conversations.filter((c) => c.status === 'live').length;
    const waitingChats = conversations.filter((c) => c.status === 'waiting').length;
    const resolvedToday = conversations.filter((c) => {
        if (c.status !== 'resolved' || !c.resolvedAt) return false;
        const today = new Date();
        const resolved = new Date(c.resolvedAt);
        return resolved.toDateString() === today.toDateString();
    }).length;

    const { data: bookingsData } = useBookings({ orgId });
    const bookingsToday = (bookingsData?.bookings || []).filter((b) => {
        const today = new Date().toDateString();
        return new Date(b.createdAt).toDateString() === today;
    }).length;

    const recentSessions = conversations.slice(0, 5);

    return (
        <div className="p-6 flex flex-col gap-6 max-w-5xl">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-500 text-sm mt-1">Welcome back, {currentAgent?.name || 'Agent'} 👋</p>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon="💬" label="Active Chats" value={activeChats} sub="Live right now" colorClass="text-blue-400" />
                <MetricCard icon="⏳" label="Waiting" value={waitingChats} sub="In queue" colorClass="text-amber-400" />
                <MetricCard icon="✅" label="Resolved Today" value={resolvedToday} colorClass="text-emerald-400" />
                <MetricCard icon="📅" label="Bookings Today" value={bookingsToday} colorClass="text-primary-400" />
            </div>

            {/* Recent conversations */}
            <div>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Recent Conversations</h2>
                {recentSessions.length === 0 ? (
                    <div className="card p-8 text-center text-slate-600">
                        <div className="text-3xl mb-2">💬</div>
                        <div>No conversations yet. They'll appear here when customers connect.</div>
                    </div>
                ) : (
                    <div className="card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    {['Customer', 'Status', 'Last Message', 'Time'].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recentSessions.map((sess) => (
                                    <tr key={sess._id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-200">{sess.customer?.name || 'Guest'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`badge-${sess.status} px-2 py-0.5 rounded-full text-xs font-medium`}>{sess.status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                                            {sess.messages?.at(-1)?.content || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 text-xs">
                                            {sess.updatedAt ? new Date(sess.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
