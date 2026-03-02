import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav.jsx';
import LeftSidebar from './LeftSidebar.jsx';
import RightSidebar from './RightSidebar.jsx';
import ChatView from './ChatView.jsx';
import { useSocket, getSocket } from '../hooks/useSocket.js';

import { useConversationStore } from '../store/conversationStore.js';
import { useUiStore } from '../store/uiStore.js';
import { useAgentStore } from '../store/agentStore.js';
import { apiFetch } from '../hooks/useApi.js';

export default function Layout() {
    useSocket(); // Establish socket connection for the whole session

    const { activeSessionId, setConversations, upsertConversation } = useConversationStore();
    const { sidebarOpen, rightPanelOpen } = useUiStore();
    const { currentAgent } = useAgentStore();


    // ── Load sessions from DB on mount and poll every 20s ────────────────────────
    useEffect(() => {
        if (!currentAgent?.orgId) return;

        const loadSessions = () => {
            apiFetch(`/api/sessions?orgId=${currentAgent.orgId}&limit=100`)
                .then((data) => {
                    const list = data.sessions || data || [];

                    // ⚠️  Do NOT call setConversations(list) — that would wipe all
                    // message history already loaded into the store for open sessions.
                    // Instead, upsert each session individually (messages=undefined in
                    // list-view responses, so the smart merge keeps existing messages).
                    const { upsertConversation, conversations } = useConversationStore.getState();

                    // Add any new sessions from server that aren't in the store yet,
                    // and update metadata (status, customer) for existing ones.
                    list.forEach((s) => upsertConversation(s));

                    // On the very first load (store is empty), also call setConversations
                    // for correct ordering.
                    if (conversations.length === 0) {
                        setConversations(list);
                    }
                })
                .catch((err) => console.warn('Failed to load sessions:', err.message));
        };

        loadSessions();
        const timer = setInterval(loadSessions, 20_000);
        return () => clearInterval(timer);
    }, [currentAgent?.orgId]);





    // ── When agent opens a conversation: join session room + load full history ──
    useEffect(() => {
        const socket = getSocket();
        if (!activeSessionId) return;

        // 1. Subscribe to real-time messages via socket
        if (socket?.connected) {
            socket.emit('watch_session', { sessionId: activeSessionId });
        }

        // 2. Only fetch full history from API if we don't have messages yet (cold load).
        //    If messages are already in the store (warm re-open), skip the fetch
        //    to avoid a state mutation → re-render → visual flicker.
        const alreadyLoaded = useConversationStore
            .getState()
            .conversations.find((c) => c._id === activeSessionId)?.messages?.length > 0;

        if (!alreadyLoaded) {
            apiFetch(`/api/sessions/${activeSessionId}`)
                .then((session) => {
                    if (session?._id) upsertConversation(session);
                })
                .catch((err) => console.warn('Failed to load session:', err.message));
        }

        // 3. Clean up: leave session room when switching away
        return () => {
            if (socket?.connected) {
                socket.emit('unwatch_session', { sessionId: activeSessionId });
            }
        };
    }, [activeSessionId]);


    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-900">
            <TopNav />
            <div className="flex flex-1 overflow-hidden">
                {/* Left: conversation list */}
                {sidebarOpen && (
                    <aside className="w-80 flex-shrink-0 flex flex-col border-r border-slate-800 overflow-hidden">
                        <LeftSidebar />
                    </aside>
                )}

                {/* Center: chat view or page outlet */}
                <main className="flex-1 overflow-hidden flex flex-col">
                    {activeSessionId ? (
                        <ChatView sessionId={activeSessionId} />
                    ) : (
                        <div className="flex-1 overflow-y-auto scrollbar-thin">
                            <Outlet />
                        </div>
                    )}
                </main>

                {/* Right: customer intel */}
                {rightPanelOpen && activeSessionId && (
                    <aside className="w-80 flex-shrink-0 flex flex-col border-l border-slate-800 overflow-hidden">
                        <RightSidebar sessionId={activeSessionId} />
                    </aside>
                )}
            </div>
        </div>
    );
}


