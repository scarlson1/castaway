// import type { Duration,} from 'date-fns';
import { differenceInHours, format, isBefore, type Duration } from 'date-fns';

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDuration(value: number) {
  const minute = Math.floor(value / 60);
  const secondLeft = Math.floor(value - minute * 60);
  return `${minute}:${secondLeft < 10 ? `0${secondLeft}` : secondLeft}`;
}

export function toFormattedDuration(s: number): Duration {
  const hours = Math.floor(s / 3600);
  const mRemain = s % 3600;
  const minutes = Math.floor(mRemain / 60);
  const sRemain = mRemain % 60;
  const seconds = Math.floor(sRemain / 60);

  return { hours, minutes, seconds };
}

export function formatRelativeTime(date) {
  const now = new Date();
  const hoursDiff = differenceInHours(now, date);

  if (hoursDiff < 24 && isBefore(date, now)) {
    // If less than 24 hours ago and the date is in the past
    return `${hoursDiff} hours ago`;
  } else {
    // Otherwise, format as a standard date
    return format(date, 'MMM dd, yyyy'); // Example format: Nov 25, 2025
  }
}
