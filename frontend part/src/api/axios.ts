import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

/** Configured Axios instance for all API calls */
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

/** Request interceptor — attach auth token */
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().token;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

import Cookies from 'js-cookie';

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

/** Response interceptor — handle 401 and unwrap data */
apiClient.interceptors.response.use(
    (response) => {
        // Automatically unwrap the data from the backend's ApiResponse wrapper
        const data = response.data;
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
            return {
                ...response,
                data: data.data,
            };
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // Skip refresh logic for login and register requests
        const isAuthRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = Cookies.get('refreshToken');
            const { logout, setToken } = useAuthStore.getState();

            if (!refreshToken) {
                isRefreshing = false;
                logout();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                // Use a separate axios instance to avoid interceptor recursion
                const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
                    refreshToken,
                });

                // The response is already unrolled by our interceptor logic... 
                // WAIT, no, we used 'axios.post' instead of 'apiClient.post' to avoid recursion.
                // So we need to manually unroll it.
                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                setToken(accessToken);
                Cookies.set('refreshToken', newRefreshToken, { expires: 7 });

                processQueue(null, accessToken);
                isRefreshing = false;

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as AxiosError, null);
                isRefreshing = false;
                logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;