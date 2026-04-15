import { VisitRequestStatus, InterestLevel } from './enums';

/** Time slot from the backend */
export interface TimeSlot {
    startTime: string;
    endTime: string;
    status: string;
}

/** Visit request entity with details */
export interface VisitRequest {
    id: string;
    visitCode: string;
    propertyId: string;
    customerId: string;
    slotId: string;
    visitRequestStatus: VisitRequestStatus;
    /** Set when feedback has been submitted — used to hide the Leave Feedback button */
    interestLevel?: string;
    feedback?: string;
    customerName?: string;
    customerEmail?: string;
    createdAt?: string;
    updatedAt?: string;
    // Nested details from backend join
    property: {
        id: string;
        propertyCode: string;
        category: string;
        propertyType: string;
    };
    slot: {
        id: string;
        visitDate: string;
        startTime: string;
        endTime: string;
    };
}

/** DTO for creating a visit request */
export interface CreateVisitRequestDto {
    propertyId: string;
    visitDate: string;
    startTime: string;
    endTime: string;
}

/** DTO for submitting feedback */
export interface CreateVisitFeedbackDto {
    interestLevel: InterestLevel;
    feedback?: string;
}

/** Rich feedback record returned by GET /visit-feedback */
export interface VisitFeedbackDetail {
    id: string;
    visitRequestId: string;
    visitCode: string;
    interestLevel: string;
    feedback: string;
    createdAt: string;
    visitDate: string;
    startTime: string;
    endTime: string;
    property: {
        id: string;
        propertyCode: string;
        propertyType: string;
        category: string;
        location: string;
    };
    customer: {
        id: string;
        name: string;
        email: string;
    };
}