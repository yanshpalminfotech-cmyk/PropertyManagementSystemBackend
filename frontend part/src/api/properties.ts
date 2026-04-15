import apiClient from './axios';
import type { Property, PropertyFormValues, PropertyQueryParams, PaginatedProperties } from '../types/Property';

/** Fetch paginated properties with filters */
export const getProperties = async (params: PropertyQueryParams): Promise<PaginatedProperties> => {
    const response = await apiClient.get('/properties', { params });
    return response.data;
};

/** Fetch broker's own properties */
export const getMyProperties = async (params: PropertyQueryParams): Promise<PaginatedProperties> => {
    const response = await apiClient.get('/properties/my', { params });
    return response.data;
};

/** Fetch a single property by ID */
export const getPropertyById = async (id: string): Promise<Property> => {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data;
};

/** Create a new property */
export const createProperty = async (data: PropertyFormValues): Promise<Property> => {
    const response = await apiClient.post('/properties', data);
    return response.data;
};

/** Update an existing property */
export const updateProperty = async (id: string, data: Partial<PropertyFormValues>): Promise<Property> => {
    const response = await apiClient.patch(`/properties/${id}`, data);
    return response.data;
};

/** Delete a property */
export const deleteProperty = async (id: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}`);
};
