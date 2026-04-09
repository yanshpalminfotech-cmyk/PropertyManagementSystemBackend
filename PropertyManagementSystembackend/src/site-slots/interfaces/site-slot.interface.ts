export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  REQUESTED = 'REQUESTED',
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
}

export interface ISlot {
  startTime: string;
  endTime: string;
}

export interface ISiteSlot {
  id: string;
  propertyId: string;
  visitDate: string;
  startTime: string;
  endTime: string;
  slotStatus: SlotStatus;
  lockedBy?: string | null;
  lockedUntil?: Date | null;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}
