export enum VisitRequestStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IVisitRequest {
  id: string;
  visitCode: string;
  propertyId: string;
  customerId: string;
  slotId: string;
  visitRequestStatus: VisitRequestStatus;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}
