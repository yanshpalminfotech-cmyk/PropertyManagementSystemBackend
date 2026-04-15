/**
 * Format area in square feet.
 * @param area - Area in sq ft
 * @returns Formatted string like "1,200 sq ft"
 */
export const formatArea = (area: number): string => {
    return `${new Intl.NumberFormat('en-IN').format(area)} sq ft`;
};
