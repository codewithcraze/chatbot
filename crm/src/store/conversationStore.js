import { create } from 'zustand';

export const useConversationStore = create((set, get) => ({
    conversations: [],
    activeSessionId: null,
    unreadCounts: {}, // { [sessionId]: number }
    filter: 'all', // 'all' | 'active' | 'waiting' | 'live' | 'resolved'
    search: '',

    setFilter: (filter) => set({ filter }),
    setSearch: (search) => set({ search }),
    setActiveSession: (sessionId) => {
        set((state) => ({
            activeSessionId: sessionId,
            unreadCounts: { ...state.unreadCounts, [sessionId]: 0 },
        }));
    },

    setConversations: (conversations) => set({ conversations }),

    upsertConversation: (session) =>
        set((state) => {
            const idx = state.conversations.findIndex((c) => c._id === session._id);

            if (idx >= 0) {
                const existing = state.conversations[idx];

                // ── Smart message merge ────────────────────────────────────────────
                // Problem: blindly spreading session.messages (from API) over
                // existing.messages (from live socket) causes a flash because
                // React sees a new array reference and re-renders all bubbles.
                //
                // Strategy:
                //   1. If API didn't send messages (list view), keep existing.
                //   2. If we have no messages yet, take whatever API gives us.
                //   3. If both sides have messages: use API as authoritative base,
                //      then append any local-only messages (optimistic/real-time)
                //      that haven't been persisted yet.
                let messages = existing.messages;
                if (session.messages !== undefined) {
                    if (!messages?.length) {
                        // Cold load – no local messages yet, take DB version
                        messages = session.messages;
                    } else {
                        // Warm reload – merge without overwriting local additions
                        const dbIds = new Set(
                            session.messages.map((m) => String(m._id))
                        );
                        // Any message in the store that is NOT in DB yet (e.g. optimistic)
                        const localOnly = existing.messages.filter(
                            (m) => m._id && !dbIds.has(String(m._id))
                        );
                        // DB messages first (with correct server order), then local-only
                        messages = [...session.messages, ...localOnly];
                    }
                }

                const next = [...state.conversations];
                next[idx] = { ...existing, ...session, messages };
                return { conversations: next };
            }

            // New session: insert at top
            return { conversations: [session, ...state.conversations] };
        }),


    addMessage: (sessionId, message) =>
        set((state) => {
            const convIdx = state.conversations.findIndex((c) => c._id === sessionId);

            if (convIdx < 0) {
                // Session not yet in store (org-room message arrived before polling).
                // Create a lightweight entry so the message is captured.
                const skeleton = {
                    _id: sessionId,
                    status: 'bot',
                    customer: {},
                    messages: [message],
                    lastMessage: message.content,
                    updatedAt: new Date(),
                };
                const unread = sessionId !== state.activeSessionId
                    ? { ...state.unreadCounts, [sessionId]: 1 }
                    : state.unreadCounts;
                return { conversations: [skeleton, ...state.conversations], unreadCounts: unread };
            }

            const conv = state.conversations[convIdx];
            const existingMsgs = conv.messages || [];

            // Deduplicate: org room + session room can both deliver the same message
            if (message._id && existingMsgs.some((m) => m._id === String(message._id))) {
                return {}; // already have it, skip
            }

            const updated = {
                ...conv,
                messages: [...existingMsgs, message],
                lastMessage: message.content,
                updatedAt: new Date(),
            };
            const next = state.conversations.map((c) => (c._id === sessionId ? updated : c));
            const unread = sessionId !== state.activeSessionId
                ? { ...state.unreadCounts, [sessionId]: (state.unreadCounts[sessionId] || 0) + 1 }
                : state.unreadCounts;
            return { conversations: next, unreadCounts: unread };
        }),


    updateSessionStatus: (sessionId, status) =>
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c._id === sessionId ? { ...c, status } : c
            ),
        })),

    /** Filtered + searched conversations */
    getFiltered: () => {
        const { conversations, filter, search } = get();
        let result = conversations;
        if (filter !== 'all') {
            const statusMap = { active: ['bot', 'live'], waiting: ['waiting'], live: ['live'], resolved: ['resolved'] };
            result = result.filter((c) => statusMap[filter]?.includes(c.status));
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) =>
                    c.customer?.name?.toLowerCase().includes(q) ||
                    c.customer?.email?.toLowerCase().includes(q) ||
                    c.messages?.at(-1)?.content?.toLowerCase().includes(q)
            );
        }
        return result;
    },
}));
