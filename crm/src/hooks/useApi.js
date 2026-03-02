import { useAgentStore } from '../store/agentStore.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function authHeaders() {
    const token = useAgentStore.getState().token;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

// ─── Sessions ────────────────────────────────────────────────
export function useSessions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return useQuery({
        queryKey: ['sessions', params],
        queryFn: () => apiFetch(`/api/sessions?${query}`),
        refetchInterval: 15_000,
    });
}

export function useSession(id) {
    return useQuery({
        queryKey: ['session', id],
        queryFn: () => apiFetch(`/api/sessions/${id}`),
        enabled: !!id,
    });
}

// ─── Bookings ────────────────────────────────────────────────
export function useBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return useQuery({
        queryKey: ['bookings', params],
        queryFn: () => apiFetch(`/api/bookings?${query}`),
        refetchInterval: 30_000,
    });
}

export function useCreateBooking() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data) => apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
    });
}

export function useUpdateBooking() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }) =>
            apiFetch(`/api/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
    });
}

export function useDeleteBooking() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => apiFetch(`/api/bookings/${id}`, { method: 'DELETE' }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
    });
}

// ─── Agents ──────────────────────────────────────────────────
export function useOnlineAgents(orgId) {
    return useQuery({
        queryKey: ['agents', 'online', orgId],
        queryFn: () => apiFetch(`/api/agents/online?orgId=${orgId}`),
        refetchInterval: 10_000,
    });
}

export function useAgents(orgId) {
    return useQuery({
        queryKey: ['agents', orgId],
        queryFn: () => apiFetch(`/api/agents?orgId=${orgId}`),
    });
}

// ─── Canned Responses ────────────────────────────────────────
export function useCannedResponses(orgId) {
    return useQuery({
        queryKey: ['canned', orgId],
        queryFn: () => apiFetch(`/api/canned-responses?orgId=${orgId}`),
        enabled: !!orgId,
    });
}

export { apiFetch };
