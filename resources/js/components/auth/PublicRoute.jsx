import { Navigate } from 'react-router-dom';
import { useAuth, getRoleRedirect } from '../../contexts/AuthContext';

export default function PublicRoute({ children }) {
    const { isAuthenticated, loading, user } = useAuth();

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

    if (isAuthenticated && user) {
        return <Navigate to={getRoleRedirect(user.role)} replace />;
    }

    return children;
}
