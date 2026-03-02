import { create } from 'zustand';

// Safely restore persisted agent data from localStorage
function loadStoredAgent() {
    try {
        const raw = localStorage.getItem('agent_data');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export const useAgentStore = create((set, get) => ({
    /** Current logged-in agent – restored from localStorage on refresh */
    currentAgent: loadStoredAgent(),
    token: localStorage.getItem('agent_token') || null,

    setAgent: (agent) => {
        // Persist to localStorage so refresh doesn't wipe agent info
        if (agent) {
            localStorage.setItem('agent_data', JSON.stringify(agent));
        } else {
            localStorage.removeItem('agent_data');
        }
        set({ currentAgent: agent });
    },

    setToken: (token) => {
        localStorage.setItem('agent_token', token);
        set({ token });
    },

    logout: () => {
        localStorage.removeItem('agent_token');
        localStorage.removeItem('agent_data');
        set({ currentAgent: null, token: null });
    },

    /** All agents (for org view) */
    agents: [],
    setAgents: (agents) => set({ agents }),
    updateAgentStatus: (agentId, status) =>
        set((state) => ({
            agents: state.agents.map((a) => (a._id === agentId ? { ...a, status } : a)),
        })),
}));

