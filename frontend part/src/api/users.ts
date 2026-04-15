import apiClient from './axios';
import type { UserRole } from '@/types/enums';

export interface User {
    id: string;
    userCode: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: number;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    status?: number;
    role?: string;
}

/** Get all users with optional role filter */
export const getUsers = async (role?: string): Promise<User[]> => {
    const response = await apiClient.get('/users', { params: { role } });
    return response.data;
};

/** Update a user (Admin only) */
export const updateUser = async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
};

/** Delete a user (Admin only) */
export const deleteUser = async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
};
