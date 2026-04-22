import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LogActivity from './pages/LogActivity';
import Report from './pages/Report';
import MyActivities from './pages/MyActivities';

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
                <Route path="/activities" element={
                    <ProtectedRoute><MyActivities /></ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}