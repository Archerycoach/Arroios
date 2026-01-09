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

/**
 * Calculate booking periods and pricing based on calendar logic
 * 
 * PRICING RULES:
 * - Full month (1st to last day): Charge monthly rate
 * - Starts on 16th or later: Charge biweekly for first partial month
 * - Ends on 15th or earlier: Charge biweekly for last partial month
 * - Middle months (complete): Charge monthly rate
 * 
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @param monthlyPrice - Monthly price for the room
 * @returns Object with total price, number of periods, breakdown, and monthly equivalent
 */
export function calculateBookingPeriods(
  checkIn: Date,
  checkOut: Date,
  monthlyPrice: number
): {
  totalPrice: number;
  numberOfPeriods: number;
  breakdown: string[];
  monthlyEquivalent: number;
} {
  const biweeklyPrice = monthlyPrice / 2;
  let totalPrice = 0;
  const breakdown: string[] = [];
  let periodCount = 0;

  const startYear = checkIn.getFullYear();
  const startMonth = checkIn.getMonth();
  const startDay = checkIn.getDate();

  const endYear = checkOut.getFullYear();
  const endMonth = checkOut.getMonth();
  const endDay = checkOut.getDate();

  // Calculate total months spanned (including partial)
  const totalMonthsSpanned = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

  // Case 1: Same month booking (check-in and check-out in the same month)
  if (startYear === endYear && startMonth === endMonth) {
    const lastDayOfMonth = new Date(startYear, startMonth + 1, 0).getDate();
    
    // Full month: starts on 1st and ends on last day
    if (startDay === 1 && endDay === lastDayOfMonth) {
      totalPrice = monthlyPrice;
      breakdown.push(`Mês completo ${startMonth + 1}/${startYear} = €${monthlyPrice.toFixed(2)}`);
      periodCount = 1;
    }
    // Starts on 16+ or ends on 15 or before: biweekly
    else if (startDay >= 16 || endDay <= 15) {
      totalPrice = biweeklyPrice;
      breakdown.push(`Dias ${startDay}-${endDay}/${startMonth + 1} (quinzena) = €${biweeklyPrice.toFixed(2)}`);
      periodCount = 0.5;
    }
    // Otherwise: full month rate
    else {
      totalPrice = monthlyPrice;
      breakdown.push(`Dias ${startDay}-${endDay}/${startMonth + 1} (mês) = €${monthlyPrice.toFixed(2)}`);
      periodCount = 1;
    }
  }
  // Case 2: Multi-month booking
  else {
    // Process each month
    for (let i = 0; i < totalMonthsSpanned; i++) {
      const currentMonth = startMonth + i;
      const currentYear = startYear + Math.floor(currentMonth / 12);
      const normalizedMonth = currentMonth % 12;
      
      const firstDayOfMonth = 1;
      const lastDayOfMonth = new Date(currentYear, normalizedMonth + 1, 0).getDate();

      // First month
      if (i === 0) {
        // Starts on 1st: full month
        if (startDay === 1) {
          totalPrice += monthlyPrice;
          breakdown.push(`Mês completo ${normalizedMonth + 1}/${currentYear} = €${monthlyPrice.toFixed(2)}`);
          periodCount += 1;
        }
        // Starts on 16+: biweekly
        else if (startDay >= 16) {
          totalPrice += biweeklyPrice;
          breakdown.push(`Dias ${startDay}-${lastDayOfMonth}/${normalizedMonth + 1} (quinzena) = €${biweeklyPrice.toFixed(2)}`);
          periodCount += 0.5;
        }
        // Starts between 2-15: full month
        else {
          totalPrice += monthlyPrice;
          breakdown.push(`Dias ${startDay}-${lastDayOfMonth}/${normalizedMonth + 1} (mês) = €${monthlyPrice.toFixed(2)}`);
          periodCount += 1;
        }
      }
      // Last month
      else if (i === totalMonthsSpanned - 1) {
        // Ends on last day: full month
        if (endDay === lastDayOfMonth) {
          totalPrice += monthlyPrice;
          breakdown.push(`Mês completo ${normalizedMonth + 1}/${currentYear} = €${monthlyPrice.toFixed(2)}`);
          periodCount += 1;
        }
        // Ends on 15 or before: biweekly
        else if (endDay <= 15) {
          totalPrice += biweeklyPrice;
          breakdown.push(`Dias 1-${endDay}/${normalizedMonth + 1} (quinzena) = €${biweeklyPrice.toFixed(2)}`);
          periodCount += 0.5;
        }
        // Ends between 16-30: full month
        else {
          totalPrice += monthlyPrice;
          breakdown.push(`Dias 1-${endDay}/${normalizedMonth + 1} (mês) = €${monthlyPrice.toFixed(2)}`);
          periodCount += 1;
        }
      }
      // Middle months (always full)
      else {
        totalPrice += monthlyPrice;
        breakdown.push(`Mês completo ${normalizedMonth + 1}/${currentYear} = €${monthlyPrice.toFixed(2)}`);
        periodCount += 1;
      }
    }
  }

  // Calculate monthly equivalent for payment purposes (round up)
  const monthlyEquivalent = Math.ceil(periodCount);

  return {
    totalPrice,
    numberOfPeriods: periodCount,
    breakdown,
    monthlyEquivalent,
  };
}