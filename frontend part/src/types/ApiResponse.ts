export interface ApiResponse<T> {
    success: boolean;
    data: T;
    timestamp: string;
    message?: string;
    statusCode?: number;
}

/** API error response */
export interface ApiErrorResponse {
    success: boolean;
    message: string;
    statusCode: number;
    timestamp: string;
    errors?: Record<string, string[]>;
}

/** Login response data portion */
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        isLocked?: boolean;
        failedLoginAttempts?: number;
    };
}

/** Register DTO */
export interface RegisterDto {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
}

/** Login DTO */
export interface LoginDto {
    email: string;
    password: string;
}
