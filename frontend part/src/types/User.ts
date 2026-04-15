import { UserRole } from './enums';

/** User entity from the backend */
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    status?: number;
    createdAt?: string;
    updatedAt?: string;
}