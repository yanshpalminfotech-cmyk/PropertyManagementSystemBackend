import apiClient from './axios';

export interface DailySummary {
    total_properties: number;
    total_visits_scheduled: number;
    total_visits_completed: number;
    total_closed_properties: number;
    top_inquired_properties: Array<{
        propertyId: string;
        propertyCode: string;
        inquiryCount: number;
    }> | null;
}

export interface PropertyPerformance {
    id: string;
    propertyCode: string;
    type: string;
    category: string;
    location: string;
    price: number;
    carpetArea: number;
    brokerName: string;
    dayCount: number;
    totalVisitRequests: number;
    completedVisits: number;
}

export interface BrokerPerformance {
    brokerName: string;
    totalProperties: number;
    activeProperties: number;
    closedThisMonth: number;
    totalVisitRequests: number;
    siteVisitsConducted: number;
    conversionRate: number;
}

export interface CustomerEngagement {
    customerName: string;
    phone: string;
    totalVisitsRequested: number;
    visitsCompleted: number;
    completionRate: number;
    mostCommonInterest: string | null;
    lastActivityDate: string;
}

/** Get daily system summary (Admin only) */
export const getDailySummary = async (): Promise<DailySummary> => {
    const response = await apiClient.get('/reports/summary');
    return response.data;
};

/** Get property performance metrics (Admin only) */
export const getPropertyPerformance = async (): Promise<PropertyPerformance[]> => {
    const response = await apiClient.get('/reports/properties-performance');
    return response.data;
};

/** Get broker performance ranking (Admin only) */
export const getBrokerPerformance = async (): Promise<BrokerPerformance[]> => {
    const response = await apiClient.get('/reports/brokers-performance');
    return response.data;
};

/** Get customer engagement stats (Admin only) */
export const getCustomerEngagement = async (): Promise<CustomerEngagement[]> => {
    const response = await apiClient.get('/reports/customers-engagement');
    return response.data;
};
