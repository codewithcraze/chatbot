import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAgentStore } from './store/agentStore.js';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import BookingsPage from './pages/BookingsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function PrivateRoute({ children }) {
    const { token } = useAgentStore();
    return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
    const { token, setAgent, logout } = useAgentStore();

    // On every page load: validate the stored JWT and refresh agent data from DB.
    // This handles:
    //   1. Token expiry         → auto-logout
    //   2. Stale localStorage   → updates with latest DB values (status, role, etc.)
    useEffect(() => {
        if (!token) return;
        fetch(`${API_URL}/api/agents/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.status === 401) {
                    // Token expired or invalid → clear stored credentials
                    logout();
                    return null;
                }
                return res.json();
            })
            .then((agent) => {
                if (agent?._id) setAgent(agent);
            })
            .catch(() => {
                // Network error – keep existing localStorage agent, don't force logout
            });
    }, []); // run once on app mount

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <Layout />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<DashboardPage />} />
                    <Route path="bookings" element={<BookingsPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

