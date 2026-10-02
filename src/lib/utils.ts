import { clsx } from "clsx"
import type { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates human-readable membership tenure from a joining date
 * Examples: "2Y", "3Y 1M", "3Y 10M", "5M", "14D", "New Member", "Upcoming"
 */
export function calculateTenure(dateStr?: string | null): string {
  if (!dateStr) return 'Recent';
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) return 'Recent';

  const now = new Date();
  start.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (start > today) return 'Upcoming';

  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  let days = today.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += prevMonthDays;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years > 0) {
    return months > 0 ? `${years}Y ${months}M` : `${years}Y`;
  }

  if (months > 0) {
    return `${months}M`;
  }

  if (days > 0) {
    return `${days}D`;
  }

  return 'New Member';
}
