/**
 * Utility functions for data sanitization and transformation
 */

/**
 * Converts empty strings to null for database insertion
 * This prevents "invalid input syntax" errors for date, numeric, and other typed fields
 */
export function sanitizeForDatabase<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    
    // Convert empty strings to null
    if (value === "") {
      sanitized[key] = null as any;
    }
    
    // Handle nested objects (but not arrays)
    if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeForDatabase(value) as any;
    }
  }
  
  return sanitized;
}

/**
 * Converts null values to empty strings for form display
 */
export function sanitizeForDisplay<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    
    // Convert null to empty string for text inputs
    if (value === null || value === undefined) {
      sanitized[key] = "" as any;
    }
    
    // Handle nested objects (but not arrays)
    if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeForDisplay(value) as any;
    }
  }
  
  return sanitized;
}

/**
 * Validates and formats a date string for database insertion
 * Returns null if invalid or empty
 */
export function formatDateForDatabase(dateString: string | null | undefined): string | null {
  if (!dateString || dateString.trim() === "") {
    return null;
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return dateString;
}

/**
 * Validates and formats a number for database insertion
 * Returns null if invalid or empty
 */
export function formatNumberForDatabase(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? null : num;
}