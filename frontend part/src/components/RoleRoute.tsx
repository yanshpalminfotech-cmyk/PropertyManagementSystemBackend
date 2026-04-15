import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { UserRole } from '../types/enums';

interface RoleRouteProps {
    role: UserRole | UserRole[];
    children: React.ReactNode;
}

/**
 * Route guard that checks user role.
 * Shows 403 Forbidden page if the user does not have the required role.
 * Admin always has access.
 */
const RoleRoute: React.FC<RoleRouteProps> = ({ role, children }) => {
    const userRole = useAuthStore((state) => state.role);
    const navigate = useNavigate();

    const allowedRoles = Array.isArray(role) ? role : [role];
    const hasAccess = userRole === UserRole.ADMIN || (userRole && allowedRoles.includes(userRole));

    if (!hasAccess) {
        return (
            <Result
                status="403"
                title="403"
                subTitle="Sorry, you are not authorized to access this page."
                extra={
                    <Button type="primary" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                }
            />
        );
    }

    return <>{children}</>;
};

export default RoleRoute;
