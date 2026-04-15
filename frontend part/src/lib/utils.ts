import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard utility for merging Tailwind CSS classes with clsx.
 * Prevents class conflicts.
 * 
 * @param inputs - List of class values to be merged
 * @returns - A single merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
