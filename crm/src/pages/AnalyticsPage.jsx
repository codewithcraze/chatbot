import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import { useConversationStore } from '../store/conversationStore.js';
import { useBookings } from '../hooks/useApi.js';
import { useAgentStore } from '../store/agentStore.js';

const COLORS = ['#6366f1', '#4ade80', '#f59e0b', '#ef4444', '#06b6d4'];

// Generate last 7 days labels
function last7Days() {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
    });
}

const PEAK_HOURS = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    chats: Math.floor(Math.random() * 20 + (i >= 9 && i <= 18 ? 15 : 2)),
}));

const RESOLUTION_DATA = [
    { name: 'Bot Resolved', value: 38 },
    { name: 'Agent Resolved', value: 47 },
    { name: 'Abandoned', value: 15 },
];

const CustomTooltipStyle = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '12px',
    padding: '8px 12px',
};

export default function AnalyticsPage() {
    const { currentAgent } = useAgentStore();
    const { conversations } = useConversationStore();
    const orgId = currentAgent?.orgId || '';
    const { data: bookingsData } = useBookings({ orgId });

    // Volume chart: simulate last 7 days from store data
    const days = last7Days();
    const volumeData = days.map((day) => ({
        day,
        conversations: Math.floor(Math.random() * 25 + 5),
        resolved: Math.floor(Math.random() * 18 + 3),
    }));

    const totalConvs = conversations.length;
    const resolved = conversations.filter((c) => c.status === 'resolved').length;
    const resolutionRate = totalConvs > 0 ? Math.round((resolved / totalConvs) * 100) : 0;

    return (
        <div className="p-6 flex flex-col gap-6 max-w-5xl">
            <div>
                <h1 className="text-2xl font-bold text-white">Analytics</h1>
                <p className="text-slate-500 text-sm mt-1">Chat volume, resolution rates, and peak hours</p>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Conversations', value: totalConvs, icon: '💬' },
                    { label: 'Resolution Rate', value: `${resolutionRate}%`, icon: '✅' },
                    { label: 'Total Bookings', value: bookingsData?.total || 0, icon: '📅' },
                ].map(({ label, value, icon }) => (
                    <div key={label} className="metric-card">
                        <div className="text-2xl">{icon}</div>
                        <div className="text-3xl font-bold text-primary-400">{value}</div>
                        <div className="text-sm text-slate-400">{label}</div>
                    </div>
                ))}
            </div>

            {/* Volume chart */}
            <div className="card p-5">
                <h2 className="text-sm font-semibold text-slate-300 mb-4">Conversation Volume — Last 7 Days</h2>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={volumeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={CustomTooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                        <Line type="monotone" dataKey="conversations" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} name="Conversations" />
                        <Line type="monotone" dataKey="resolved" stroke="#4ade80" strokeWidth={2.5} dot={{ r: 3, fill: '#4ade80' }} name="Resolved" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Dual: peak hours + resolution pie */}
            <div className="grid grid-cols-2 gap-4">
                <div className="card p-5">
                    <h2 className="text-sm font-semibold text-slate-300 mb-4">Peak Hours</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={PEAK_HOURS.filter((_, i) => i % 2 === 0)} barSize={10}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={CustomTooltipStyle} />
                            <Bar dataKey="chats" fill="#6366f1" radius={[4, 4, 0, 0]} name="Chats" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card p-5">
                    <h2 className="text-sm font-semibold text-slate-300 mb-4">Resolution Breakdown</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={RESOLUTION_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                                {RESOLUTION_DATA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={CustomTooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
