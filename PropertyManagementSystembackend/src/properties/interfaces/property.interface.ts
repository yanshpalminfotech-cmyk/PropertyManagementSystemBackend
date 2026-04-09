export enum PropertyType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
}

export enum PropertyCategory {
  BHK1 = '1BHK',
  BHK2 = '2BHK',
  BHK3 = '3BHK',
  VILLA = 'VILLA',
  PLOT = 'PLOT',
  SHOP = 'SHOP',
  OFFICE = 'OFFICE',
}

export enum TransactionType {
  SALE = 'SALE',
  RENT = 'RENT',
}

export enum PropertyLocation {
  ADAJAN = 'ADAJAN',
  VESU = 'VESU',
  CITYLIGHT = 'CITYLIGHT',
  PIPLOD = 'PIPLOD',
  PAL = 'PAL',
  MAGDALLA = 'MAGDALLA',
}

export enum FurnishingStatus {
  FURNISHED = 'FURNISHED',
  SEMI_FURNISHED = 'SEMI_FURNISHED',
  UNFURNISHED = 'UNFURNISHED',
}

export enum PropertyAvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  RENTED = 'RENTED',
  UNDER_NEGOTIATION = 'UNDER_NEGOTIATION',
}

export interface IProperty {
  id: string;
  propertyCode: string;
  brokerId: string;
  propertyType: PropertyType;
  category: PropertyCategory;
  transactionType: TransactionType;
  location: PropertyLocation;
  address: string;
  ownerName: string;
  ownerMobileNumber: string;
  carpetArea: number;
  builtUpArea: number;
  price: number;
  maintenanceCost?: number;
  brokerCommission?: number;
  furnishing: FurnishingStatus;
  parking: boolean;
  floorNumber?: number;
  totalFloors?: number;
  propertyAge?: number;
  facing?: string;
  description?: string;
  amenities?: string;
  availableForVisit: boolean;
  propertiesstatus: PropertyAvailabilityStatus;
  postedDate?: Date;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}
