import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LogActivity from './pages/LogActivity';
import Report from './pages/Report';
import MyActivities from './pages/MyActivities';
import { useAuth } from './context/AuthContext';
import { isTokenValid } from './utils/api';

function ProtectedRoute({ children }) {
    const { token } = useAuth();
    return (token && isTokenValid(token)) ? children : <Navigate to="/" />;
}

export default function App() {
    return (
        <BrowserRouter>
            <a href="#main-content" className="skip-link">Skip to main content</a>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        fontFamily: 'Figtree, system-ui, sans-serif',
                        fontSize: '14px',
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
                    },
                    success: {
                        style: { background: '#E8F5E9', color: '#2E7D32', border: '1px solid rgba(56,142,60,0.2)' },
                        iconTheme: { primary: '#2E7D32', secondary: '#E8F5E9' },
                    },
                    error: {
                        style: { background: '#FEE2E2', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' },
                        iconTheme: { primary: '#EF4444', secondary: '#FEE2E2' },
                    },
                }}
            />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="/log" element={
                    <ProtectedRoute><LogActivity /></ProtectedRoute>
                } />
                <Route path="/report" element={
                    <ProtectedRoute><Report /></ProtectedRoute>
                } />
                <Route path="/activities" element={
                    <ProtectedRoute><MyActivities /></ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}
