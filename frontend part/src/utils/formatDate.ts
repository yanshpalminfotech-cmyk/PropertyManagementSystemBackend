/**
 * Format a date string to a readable format.
 * @param dateString - ISO date string
 * @returns Formatted date like "15 Apr 2025"
 */
export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};
