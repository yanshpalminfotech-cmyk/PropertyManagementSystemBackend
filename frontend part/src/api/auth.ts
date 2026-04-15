import apiClient from './axios';
import type { LoginDto, RegisterDto, LoginResponse } from '../types/ApiResponse';

/** Login with email and password */
export const loginApi = async (data: LoginDto): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
};

/** Register a new customer */
export const registerApi = async (data: RegisterDto): Promise<void> => {
    await apiClient.post('/auth/register', data);
};

/** Logout the current user */
export const logoutApi = async (): Promise<void> => {
    await apiClient.post('/auth/logout');
};

/** Get current user profile */
export const getProfileApi = async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
};
