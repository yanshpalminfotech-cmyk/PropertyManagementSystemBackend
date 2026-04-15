/**
 * Format a number as Indian Rupee currency.
 * @param amount - The amount to format
 * @returns Formatted string like ₹50,00,000
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};
