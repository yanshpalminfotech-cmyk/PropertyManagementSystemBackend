import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/User';
import { UserRole } from '../types/enums';

/** Auth store state and actions */
interface AuthState {
    user: User | null;
    token: string | null;
    role: UserRole | null;
    login: (user: User, token: string) => void;
    setToken: (token: string) => void;
    logout: () => void;
}

/**
 * Zustand auth store with localStorage persistence.
 * Stores user, token, and role. Clears everything on logout.
 */
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            role: null,
            login: (user: User, token: string) =>
                set({ user, token, role: user.role }),
            setToken: (token: string) =>
                set({ token }),
            logout: () =>
                set({ user: null, token: null, role: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
