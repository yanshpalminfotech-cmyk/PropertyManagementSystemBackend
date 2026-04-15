import {
    PropertyType,
    PropertyCategory,
    TransactionType,
    PropertyLocation,
    PropertyStatus,
    Furnishing,
    FacingDirection,
} from './enums';

/** Property entity from the backend */
export interface Property {
    id: string;
    propertyCode?: string;
    propertyType: PropertyType;
    category: PropertyCategory;
    transactionType: TransactionType;
    location: PropertyLocation;
    address: string;
    ownerName?: string;
    ownerMobileNumber?: string;
    carpetArea: number;
    builtUpArea: number;
    price: number;
    maintenanceCost?: number;
    brokerCommission?: number;
    furnishing: Furnishing;
    parking: boolean | string;
    floorNumber?: number;
    totalFloors?: number;
    propertyAge?: number;
    facing?: FacingDirection;
    description?: string;
    amenities?: string;
    availableForVisit?: boolean;
    propertiesstatus: PropertyStatus;
    postedDate?: string;
    brokerId?: string;
    brokerName?: string;
    createdAt?: string;
    updatedAt?: string;
}

/** Form values for creating/editing a property */
export interface PropertyFormValues {
    propertyType: PropertyType;
    category: PropertyCategory;
    transactionType: TransactionType;
    location: PropertyLocation;
    address: string;
    ownerName?: string;
    ownerMobileNumber?: string;
    carpetArea: number;
    builtUpArea: number;
    price: number;
    maintenanceCost?: number;
    brokerCommission?: number;
    furnishing: Furnishing;
    parking: boolean | string;
    floorNumber?: number;
    totalFloors?: number;
    propertyAge?: number;
    facing?: FacingDirection;
    description?: string;
    amenities?: string;
    availableForVisit?: boolean;
    propertiesstatus: PropertyStatus;
}

/** Query params for property listing */
export interface PropertyQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    type?: PropertyType;
    category?: PropertyCategory;
    transactionType?: TransactionType;
    location?: PropertyLocation;
    propertiesstatus?: PropertyStatus;
    minPrice?: number;
    maxPrice?: number;
    availableForVisit?: boolean;
    status?: string;
}

/** Paginated response for properties */
export interface PaginatedProperties {
    items: Property[];
    total: number;
    page: number;
    lastPage: number;
}