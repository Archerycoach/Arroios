import React from "react";
import { Input } from "@/components/ui/input";

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * DateInput component that displays and accepts dates in dd/mm/yyyy format
 * while internally converting to/from yyyy-mm-dd format for database compatibility
 */
export function DateInput({ value, onChange, ...props }: DateInputProps) {
  // Convert yyyy-mm-dd to dd/mm/yyyy for display
  const formatToDisplay = (isoDate: string): string => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  };

  // Convert dd/mm/yyyy to yyyy-mm-dd for internal use
  const formatToISO = (displayDate: string): string => {
    if (!displayDate) return "";
    const parts = displayDate.replace(/\D/g, ""); // Remove non-digits
    
    if (parts.length !== 8) return "";
    
    const day = parts.substring(0, 2);
    const month = parts.substring(2, 4);
    const year = parts.substring(4, 8);
    
    // Basic validation
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
      return "";
    }
    
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow only numbers and slashes
    const cleaned = inputValue.replace(/[^\d/]/g, "");
    
    // Auto-format as user types
    let formatted = cleaned;
    if (cleaned.length >= 2 && !cleaned.includes("/")) {
      formatted = cleaned.substring(0, 2) + "/" + cleaned.substring(2);
    }
    if (cleaned.length >= 5 && cleaned.split("/").length === 2) {
      const parts = cleaned.split("/");
      formatted = parts[0] + "/" + parts[1].substring(0, 2) + "/" + parts[1].substring(2);
    }
    
    // Update the input display
    e.target.value = formatted;
    
    // If complete date (10 chars: dd/mm/yyyy), convert to ISO and call onChange
    if (formatted.length === 10) {
      const isoDate = formatToISO(formatted);
      if (isoDate && onChange) {
        onChange(isoDate);
      }
    } else if (formatted.length === 0 && onChange) {
      // Empty input
      onChange("");
    }
  };

  const displayValue = value ? formatToDisplay(value) : "";

  return (
    <Input
      {...props}
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder="dd/mm/aaaa"
      maxLength={10}
    />
  );
}