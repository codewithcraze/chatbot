import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../store/agentStore.js';
import { apiFetch } from '../hooks/useApi.js';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { setAgent, setToken } = useAgentStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await apiFetch('/api/agents/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            setToken(data.token);
            setAgent(data.agent);
            toast.success(`Welcome back, ${data.agent.name}! 👋`);
            navigate('/');
        } catch (err) {
            toast.error(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            {/* Background gradient blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 border border-primary-500/30 rounded-2xl mb-4">
                        <span className="text-3xl">💬</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">ChatCRM</h1>
                    <p className="text-slate-500 text-sm mt-1">Agent Dashboard</p>
                </div>

                {/* Form card */}
                <form
                    onSubmit={handleSubmit}
                    className="glass rounded-2xl p-6 flex flex-col gap-4"
                >
                    <h2 className="text-lg font-semibold text-slate-200">Sign in to your account</h2>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="agent@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-slate-400 font-medium">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary py-3 mt-1 flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
                        ) : (
                            '→ Sign In'
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-slate-600 mt-4">
                    Contact your admin to get access.
                </p>
            </div>
        </div>
    );
}
