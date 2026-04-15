import apiClient from './axios';
import type { VisitRequest, CreateVisitRequestDto, CreateVisitFeedbackDto, TimeSlot } from '../types/VisitRequest';

/** Get available slots for a property on a date */
export const getAvailableSlots = async (propertyId: string, date: string): Promise<TimeSlot[]> => {
    const response = await apiClient.get(`/site-slots/${propertyId}/available-slots`, {
        params: { date },
    });
    return response.data;
};

/** Create a visit request */
export const createVisitRequest = async (data: CreateVisitRequestDto): Promise<VisitRequest> => {
    const response = await apiClient.post('/visit-requests', data);
    return response.data;
};

/** Get current user's visit requests */
export const getMyVisitRequests = async (): Promise<VisitRequest[]> => {
    const response = await apiClient.get('/visit-requests/my');
    return response.data;
};

/** Cancel a visit request */
export const cancelVisitRequest = async (id: string): Promise<void> => {
    await apiClient.patch(`/visit-requests/${id}/confirm`, { status: 'CANCELLED' });
};

/** Confirm/Approve a visit request (Admin/Broker) */
export const confirmVisitRequest = async (id: string): Promise<void> => {
    await apiClient.patch(`/visit-requests/${id}/confirm`, { status: 'CONFIRMED' });
};

/** Mark visit as completed (Broker only) */
export const completeVisitRequest = async (id: string): Promise<void> => {
    await apiClient.patch(`/visit-requests/${id}/complete`, { status: 'COMPLETED' });
};

/** Submit feedback for a visit (Customer only) */
export const submitVisitFeedback = async (id: string, data: CreateVisitFeedbackDto): Promise<void> => {
    await apiClient.patch(`/visit-requests/${id}/feedback`, data);
};
