import { useState } from 'react';
import { apiFetch } from '../hooks/useApi.js';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    confirmed: 'text-emerald-400',
    modified: 'text-amber-400',
    cancelled: 'text-red-400',
};

export default function CustomerIntel({ conversation, bookings = [] }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});

    if (!conversation) {
        return (
            <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
                Select a conversation
            </div>
        );
    }

    const { customer = {}, metadata = {}, _id: sessionId } = conversation;

    const handleEdit = () => {
        setForm({ name: customer.name, email: customer.email, phone: customer.phone });
        setEditing(true);
    };

    const handleSave = async () => {
        try {
            await apiFetch(`/api/sessions/${sessionId}/customer`, {
                method: 'PATCH',
                body: JSON.stringify(form),
            });
            toast.success('Customer updated');
            setEditing(false);
        } catch {
            toast.error('Failed to update');
        }
    };

    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-200 text-sm">Customer Intel</h3>
                <button onClick={editing ? handleSave : handleEdit} className="btn-ghost text-xs">
                    {editing ? '💾 Save' : '✏️ Edit'}
                </button>
            </div>

            {/* Customer info */}
            <div className="card p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold text-lg">
                        {customer.name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-200">{customer.name || 'Guest'}</div>
                        <div className="text-xs text-slate-500">{conversation.status}</div>
                    </div>
                </div>

                {editing ? (
                    <div className="flex flex-col gap-2">
                        {['name', 'email', 'phone'].map((f) => (
                            <input
                                key={f}
                                className="input-field"
                                placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                                value={form[f] || ''}
                                onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5 text-sm">
                        {customer.email && <div className="flex gap-2"><span className="text-slate-500 w-12">Email</span><span className="text-slate-300 truncate">{customer.email}</span></div>}
                        {customer.phone && <div className="flex gap-2"><span className="text-slate-500 w-12">Phone</span><span className="text-slate-300">{customer.phone}</span></div>}
                        {customer.ip && <div className="flex gap-2"><span className="text-slate-500 w-12">IP</span><span className="text-slate-400 font-mono text-xs">{customer.ip}</span></div>}
                    </div>
                )}
            </div>

            {/* Session metadata */}
            <div className="card p-4 flex flex-col gap-2">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Session</div>
                {[
                    ['Browser', metadata.browser],
                    ['OS', metadata.os],
                    ['Page', metadata.sourceUrl],
                    ['Location', customer.location],
                    ['Device', customer.device],
                ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label} className="flex gap-2 text-xs">
                        <span className="text-slate-500 w-16 flex-shrink-0">{label}</span>
                        <span className="text-slate-400 truncate">{val}</span>
                    </div>
                ))}
            </div>

            {/* Bookings */}
            <div className="card p-4 flex flex-col gap-2">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Bookings ({bookings.length})</div>
                {bookings.length === 0 && <div className="text-xs text-slate-600">No bookings yet</div>}
                {bookings.map((b) => (
                    <div key={b._id} className="bg-slate-800 rounded-lg p-2 text-xs flex flex-col gap-0.5">
                        <div className="flex justify-between">
                            <span className="text-slate-300 font-medium">{b.service}</span>
                            <span className={STATUS_COLORS[b.status] || 'text-slate-400'}>{b.status}</span>
                        </div>
                        <span className="text-slate-500">{new Date(b.datetime).toLocaleString()}</span>
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="flex flex-col gap-2">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Quick Actions</div>
                <div className="grid grid-cols-2 gap-2">
                    <button className="btn-secondary text-xs">📅 New Booking</button>
                    <button className="btn-secondary text-xs">🔁 Transfer</button>
                    <button className="btn-secondary text-xs">📝 Add Note</button>
                    <button className="btn-secondary text-xs text-red-400">🚫 Ban</button>
                </div>
            </div>
        </div>
    );
}
