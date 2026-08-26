import { Navigate } from 'react-router-dom';
import { useAuth, getRoleRedirect } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        if (!user || !allowedRoles.includes(user.role)) {
            const redirectPath = getRoleRedirect(user?.role);
            return <Navigate to={redirectPath} replace />;
        }
    }

    return children;
}
