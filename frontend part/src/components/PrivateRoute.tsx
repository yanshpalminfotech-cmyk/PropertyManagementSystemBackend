import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

interface PrivateRouteProps {
    children: React.ReactNode;
}

/**
 * Route guard that redirects unauthenticated users to /login.
 * Reads token from Zustand auth store.
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const token = useAuthStore((state) => state.token);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default PrivateRoute;
