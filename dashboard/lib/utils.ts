import { clsx, type ClassValue } from "clsx";

/**
 * Utility for combining class names.
 * Uses clsx for conditional class joining.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
