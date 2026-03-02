import { useState } from 'react';
import { useAgentStore } from '../store/agentStore.js';
import { useCannedResponses, useAgents } from '../hooks/useApi.js';
import { apiFetch } from '../hooks/useApi.js';
import toast from 'react-hot-toast';

function Section({ title, children }) {
    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-800 pb-2">{title}</h2>
            {children}
        </div>
    );
}

export default function SettingsPage() {
    const { currentAgent } = useAgentStore();
    const orgId = currentAgent?.orgId || '';

    const { data: cannedData, refetch: refetchCanned } = useCannedResponses(orgId);
    const { data: agentsData, refetch: refetchAgents } = useAgents(orgId);

    const [newCanned, setNewCanned] = useState({ shortcut: '', message: '', category: 'general' });
    const [newAgent, setNewAgent] = useState({ name: '', email: '', password: '', role: 'agent' });

    const handleCreateCanned = async (e) => {
        e.preventDefault();
        try {
            await apiFetch('/api/canned-responses', {
                method: 'POST',
                body: JSON.stringify({ ...newCanned, orgId }),
            });
            toast.success('Canned response created');
            setNewCanned({ shortcut: '', message: '', category: 'general' });
            refetchCanned();
        } catch (err) { toast.error(err.message); }
    };

    const handleDeleteCanned = async (id) => {
        try {
            await apiFetch(`/api/canned-responses/${id}`, { method: 'DELETE' });
            toast.success('Deleted');
            refetchCanned();
        } catch { toast.error('Failed to delete'); }
    };

    const handleCreateAgent = async (e) => {
        e.preventDefault();
        try {
            await apiFetch('/api/agents/register', {
                method: 'POST',
                body: JSON.stringify({ ...newAgent, orgId }),
            });
            toast.success(`Agent ${newAgent.name} created`);
            setNewAgent({ name: '', email: '', password: '', role: 'agent' });
            refetchAgents();
        } catch (err) { toast.error(err.message); }
    };

    return (
        <div className="p-6 flex flex-col gap-8 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-slate-500 text-sm mt-0.5">Manage canned responses and agent accounts</p>
            </div>

            {/* ── Canned Responses ─────────────────────────── */}
            <Section title="Canned Responses">
                <form onSubmit={handleCreateCanned} className="card p-4 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500">Shortcut (without /)</label>
                            <input className="input-field" placeholder="greet" value={newCanned.shortcut}
                                onChange={(e) => setNewCanned((p) => ({ ...p, shortcut: e.target.value }))} required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-slate-500">Category</label>
                            <input className="input-field" placeholder="general" value={newCanned.category}
                                onChange={(e) => setNewCanned((p) => ({ ...p, category: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">Message</label>
                        <textarea className="input-field" rows={2} placeholder="Hi there! How can I help you today?"
                            value={newCanned.message}
                            onChange={(e) => setNewCanned((p) => ({ ...p, message: e.target.value }))} required />
                    </div>
                    <button type="submit" className="btn-primary self-start">+ Add Response</button>
                </form>

                <div className="card overflow-hidden">
                    {(cannedData || []).length === 0 ? (
                        <div className="p-6 text-center text-slate-600 text-sm">No canned responses yet</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    {['Shortcut', 'Category', 'Message', ''].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(cannedData || []).map((cr) => (
                                    <tr key={cr._id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="px-4 py-3 font-mono text-primary-400">/{cr.shortcut}</td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">{cr.category}</td>
                                        <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">{cr.message}</td>
                                        <td className="px-4 py-3">
                                            <button className="btn-ghost text-xs text-red-400" onClick={() => handleDeleteCanned(cr._id)}>🗑</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Section>

            {/* ── Agent Management ──────────────────────────── */}
            {currentAgent?.role === 'admin' && (
                <Section title="Agent Management">
                    <form onSubmit={handleCreateAgent} className="card p-4 flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            {[['Name', 'name', 'text', 'Jane Smith'], ['Email', 'email', 'email', 'jane@company.com']].map(([label, key, type, ph]) => (
                                <div key={key} className="flex flex-col gap-1">
                                    <label className="text-xs text-slate-500">{label}</label>
                                    <input type={type} className="input-field" placeholder={ph}
                                        value={newAgent[key]} onChange={(e) => setNewAgent((p) => ({ ...p, [key]: e.target.value }))} required />
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-slate-500">Password</label>
                                <input type="password" className="input-field" placeholder="••••••••"
                                    value={newAgent.password} onChange={(e) => setNewAgent((p) => ({ ...p, password: e.target.value }))} required />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-slate-500">Role</label>
                                <select className="input-field" value={newAgent.role}
                                    onChange={(e) => setNewAgent((p) => ({ ...p, role: e.target.value }))}>
                                    <option value="agent">Agent</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn-primary self-start">+ Add Agent</button>
                    </form>

                    <div className="card overflow-hidden">
                        {(agentsData || []).length === 0 ? (
                            <div className="p-6 text-center text-slate-600 text-sm">No agents found</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        {['Agent', 'Role', 'Status', 'Active Chats'].map((h) => (
                                            <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(agentsData || []).map((a) => (
                                        <tr key={a._id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-200">{a.name}</div>
                                                <div className="text-xs text-slate-500">{a.email}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs px-2 py-0.5 rounded-full border border-slate-600 text-slate-400">{a.role}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`badge-${a.status} px-2 py-0.5 rounded-full text-xs font-medium`}>{a.status}</span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400">{a.activeSessions?.length || 0} / {a.maxConcurrent}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Section>
            )}
        </div>
    );
}
