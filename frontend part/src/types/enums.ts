export enum UserRole {
    ADMIN = 'ADMIN',
    BROKER = 'BROKER',
    CUSTOMER = 'CUSTOMER',
}

/** Property types */
export enum PropertyType {
    RESIDENTIAL = 'RESIDENTIAL',
    COMMERCIAL = 'COMMERCIAL',
}

/** Property category options */
export enum PropertyCategory {
    '1BHK' = '1BHK',
    '2BHK' = '2BHK',
    '3BHK' = '3BHK',
    VILLA = 'VILLA',
    PLOT = 'PLOT',
    SHOP = 'SHOP',
    OFFICE = 'OFFICE',
}

/** Transaction type */
export enum TransactionType {
    SALE = 'SALE',
    RENT = 'RENT',
}

/** Property locations in Surat */
export enum PropertyLocation {
    ADAJAN = 'ADAJAN',
    VESU = 'VESU',
    CITYLIGHT = 'CITYLIGHT',
    PIPLOD = 'PIPLOD',
    PAL = 'PAL',
    MAGDALLA = 'MAGDALLA',
}

/** Property status */
export enum PropertyStatus {
    AVAILABLE = 'AVAILABLE',
    UNDER_NEGOTIATION = 'UNDER_NEGOTIATION',
    SOLD = 'SOLD',
    RENTED = 'RENTED',
}

/** Furnishing options */
export enum Furnishing {
    UNFURNISHED = 'UNFURNISHED',
    SEMI_FURNISHED = 'SEMI_FURNISHED',
    FULLY_FURNISHED = 'FULLY_FURNISHED',
    FURNISHED = 'FURNISHED',
}

/** Parking options */
export enum Parking {
    NONE = 'NONE',
    TWO_WHEELER = 'TWO_WHEELER',
    FOUR_WHEELER = 'FOUR_WHEELER',
    BOTH = 'BOTH',
}

/** Facing direction */
export enum FacingDirection {
    EAST = 'East',
    WEST = 'West',
    NORTH = 'North',
    SOUTH = 'South',
}

/** Visit request status */
export enum VisitRequestStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

/** Interest level for visit feedback */
export enum InterestLevel {
    NOT_INTERESTED = 'NOT_INTERESTED',
    MAYBE = 'MAYBE',
    INTERESTED = 'INTERESTED',
    VERY_INTERESTED = 'VERY_INTERESTED',
}
