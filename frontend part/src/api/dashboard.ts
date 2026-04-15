import apiClient from './axios';

export interface DashboardStats {
    // Admin
    totalProperties?: number;
    totalBrokers?: number;
    totalCustomers?: number;

    // Broker
    totalMyProperties?: number;
    pendingVisits?: number;
    confirmedVisits?: number;

    // Customer
    totalMyRequests?: number;
    completedVisits?: number;
}

/** Get dashboard statistics tailored to the current user role */
export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
};
