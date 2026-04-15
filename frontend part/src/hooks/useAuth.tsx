import Cookies from 'js-cookie';
import { useCallback } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { loginApi, logoutApi } from '../api/auth';
import type { User } from '../types/User';
import type { UserRole } from '../types/enums';
import type { LoginDto } from '../types/ApiResponse';

/**
 * Custom hook for authentication operations.
 */
export const useAuth = () => {
    const { user, token, role, login: storeLogin, logout: storeLogout } = useAuthStore();

    const login = useCallback(
        async (credentials: LoginDto) => {
            const response = await loginApi(credentials);
            
            const userData: User = {
                id: response.user.id,
                name: response.user.name,
                email: response.user.email,
                role: response.user.role as UserRole,
            };

            // Store refresh token in cookie
            Cookies.set('refreshToken', response.refreshToken, { 
                expires: 7, // 7 days
                secure: true, 
                sameSite: 'strict' 
            });

            storeLogin(userData, response.accessToken);
        },
        [storeLogin]
    );

    const logout = useCallback(async () => {
        try {
            await logoutApi();
        } catch {
            // Proceed even if server-side logout fails
        }
        
        Cookies.remove('refreshToken');
        storeLogout();
    }, [storeLogout]);

    return { user, token, role, login, logout };
};
