import { NavLink, useNavigate } from 'react-router-dom';
import { useAgentStore } from '../store/agentStore.js';
import { useConversationStore } from '../store/conversationStore.js';
import { useUiStore } from '../store/uiStore.js';
import { apiFetch } from '../hooks/useApi.js';
import { getSocket } from '../hooks/useSocket.js';
import { AGENT_EVENTS } from '../../../shared/constants.js';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
    { value: 'online', label: '🟢 Online' },
    { value: 'away', label: '🟡 Away' },
    { value: 'offline', label: '🔴 Offline' },
];

const NAV_LINKS = [
    { to: '/', label: 'Dashboard', icon: '📊', end: true },
    { to: '/bookings', label: 'Bookings', icon: '📅' },
    { to: '/analytics', label: 'Analytics', icon: '📈' },
    { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function TopNav() {
    const { currentAgent, setAgent, logout } = useAgentStore();
    const { conversations } = useConversationStore();
    const { notifications, clearNotifications, toggleSidebar } = useUiStore();
    const navigate = useNavigate();

    const activeCount = conversations.filter((c) => c.status === 'live').length;
    const waitingCount = conversations.filter((c) => c.status === 'waiting').length;

    const handleStatusChange = async (status) => {
        if (!currentAgent) return;
        try {
            await apiFetch(`/api/agents/${currentAgent._id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            setAgent({ ...currentAgent, status });
            const socket = getSocket();
            if (socket) {
                socket.emit(AGENT_EVENTS.AGENT_LOGIN, {
                    agentId: currentAgent._id,
                    orgId: currentAgent.orgId,
                    status,
                });
            }
        } catch (e) {
            toast.error('Failed to update status');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900 flex-shrink-0 z-10">
            {/* Left: logo + toggle + nav links */}
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="btn-ghost p-2 rounded-lg"
                    aria-label="Toggle sidebar"
                >
                    ☰
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">C</div>
                    <span className="font-bold text-white text-sm hidden sm:block">ChatCRM</span>
                </div>
                <div className="hidden md:flex items-center gap-1">
                    {NAV_LINKS.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.end}
                            className={({ isActive }) =>
                                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-primary-500/15 text-primary-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`
                            }
                        >
                            <span>{link.icon}</span>
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>

            {/* Right: live counts + status + agent */}
            <div className="flex items-center gap-3">
                {/* Live / waiting counts */}
                <div className="hidden sm:flex items-center gap-2">
                    <span className="badge-live px-2 py-0.5 rounded-full text-xs font-medium">
                        {activeCount} live
                    </span>
                    {waitingCount > 0 && (
                        <span className="badge-waiting px-2 py-0.5 rounded-full text-xs font-medium animate-pulse">
                            {waitingCount} waiting
                        </span>
                    )}
                </div>

                {/* Notifications bell */}
                <div className="relative">
                    <button
                        className="btn-ghost p-2 relative"
                        onClick={clearNotifications}
                        title={`${notifications.length} notifications`}
                    >
                        🔔
                        {notifications.length > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">
                                {notifications.length > 9 ? '9+' : notifications.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Status selector */}
                {currentAgent && (
                    <select
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-primary-500 cursor-pointer"
                        value={currentAgent.status || 'online'}
                        onChange={(e) => handleStatusChange(e.target.value)}
                    >
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                )}

                {/* Agent info + logout dropdown */}
                {currentAgent && (
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-primary-500/30 border border-primary-500/50 flex items-center justify-center text-primary-300 text-sm font-semibold flex-shrink-0">
                            {currentAgent.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        {/* Name + role */}
                        <div className="hidden sm:block">
                            <div className="text-xs font-semibold text-slate-200 leading-tight">{currentAgent.name}</div>
                            <div className="text-[10px] text-slate-500 capitalize">{currentAgent.role}</div>
                        </div>
                        {/* Logout button – clearly labeled */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border border-transparent hover:border-red-500/20 ml-1"
                            title="Logout"
                        >
                            <span>↩</span>
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}

