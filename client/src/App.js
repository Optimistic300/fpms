import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LogActivity from './pages/LogActivity';
import Report from './pages/Report';

function ProtectedRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
}

export default function App() {
    return (
        <BrowserRouter>
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
            </Routes>
        </BrowserRouter>
    );
}