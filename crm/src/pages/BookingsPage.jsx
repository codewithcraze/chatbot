import { useState } from 'react';
import { useAgentStore } from '../store/agentStore.js';
import { useBookings, useUpdateBooking, useDeleteBooking, useCreateBooking } from '../hooks/useApi.js';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    confirmed: 'badge-live',
    modified: 'badge-waiting',
    cancelled: 'badge-resolved',
};

export default function BookingsPage() {
    const { currentAgent } = useAgentStore();
    const orgId = currentAgent?.orgId || '';
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editBooking, setEditBooking] = useState(null);

    const { data, isLoading } = useBookings({ orgId, status: statusFilter, search });
    const updateMutation = useUpdateBooking();
    const deleteMutation = useDeleteBooking();
    const createMutation = useCreateBooking();

    const bookings = data?.bookings || [];

    const handleCancel = async (id) => {
        if (!confirm('Cancel this booking?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            toast.success('Booking cancelled');
        } catch { toast.error('Failed to cancel'); }
    };

    return (
        <div className="p-6 flex flex-col gap-5 max-w-5xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">Bookings</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{data?.total || 0} total bookings</p>
                </div>
                <button onClick={() => { setEditBooking(null); setShowModal(true); }} className="btn-primary">
                    + New Booking
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <input
                    className="input-field w-60"
                    placeholder="🔍 Search name, email, service…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="input-field w-44"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="modified">Modified</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">Loading bookings…</div>
                ) : bookings.length === 0 ? (
                    <div className="p-8 text-center text-slate-600">
                        <div className="text-3xl mb-2">📅</div>
                        <div>No bookings found</div>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700">
                                {['Customer', 'Service', 'Date & Time', 'Status', 'Actions'].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 uppercase font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b) => (
                                <tr key={b._id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-200">{b.customer?.name}</div>
                                        <div className="text-xs text-slate-500">{b.customer?.email}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-300">{b.service}</td>
                                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(b.datetime).toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`${STATUS_COLORS[b.status] || 'badge-offline'} px-2 py-0.5 rounded-full text-xs font-medium`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                className="btn-ghost text-xs py-1"
                                                onClick={() => { setEditBooking(b); setShowModal(true); }}
                                            >
                                                ✏️ Edit
                                            </button>
                                            {b.status !== 'cancelled' && (
                                                <button
                                                    className="btn-ghost text-xs py-1 text-red-400"
                                                    onClick={() => handleCancel(b._id)}
                                                >
                                                    ❌ Cancel
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <BookingModal
                    booking={editBooking}
                    orgId={orgId}
                    onClose={() => setShowModal(false)}
                    onCreate={(data) => createMutation.mutateAsync(data).then(() => { toast.success('Booking created'); setShowModal(false); })}
                    onUpdate={(id, data) => updateMutation.mutateAsync({ id, ...data }).then(() => { toast.success('Booking updated'); setShowModal(false); })}
                />
            )}
        </div>
    );
}

function BookingModal({ booking, orgId, onClose, onCreate, onUpdate }) {
    const [form, setForm] = useState({
        service: booking?.service || '',
        datetime: booking?.datetime ? new Date(booking.datetime).toISOString().slice(0, 16) : '',
        customerName: booking?.customer?.name || '',
        customerEmail: booking?.customer?.email || '',
        status: booking?.status || 'confirmed',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            service: form.service,
            datetime: form.datetime,
            customer: { name: form.customerName, email: form.customerEmail },
            orgId,
            sessionId: booking?.sessionId || '000000000000000000000000',
        };
        booking ? onUpdate(booking._id, payload) : onCreate(payload);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <form
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md flex flex-col gap-4 animate-slide-up"
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-200">{booking ? 'Edit Booking' : 'New Booking'}</h3>
                    <button type="button" onClick={onClose} className="btn-ghost p-1">✕</button>
                </div>
                {[
                    { label: 'Customer Name', key: 'customerName', type: 'text' },
                    { label: 'Customer Email', key: 'customerEmail', type: 'email' },
                    { label: 'Service', key: 'service', type: 'text' },
                    { label: 'Date & Time', key: 'datetime', type: 'datetime-local' },
                ].map(({ label, key, type }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400">{label}</label>
                        <input
                            type={type}
                            className="input-field"
                            value={form[key]}
                            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                            required
                        />
                    </div>
                ))}
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" className="btn-primary flex-1">{booking ? 'Save Changes' : 'Create Booking'}</button>
                </div>
            </form>
        </div>
    );
}
