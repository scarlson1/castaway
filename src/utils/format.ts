// import type { Duration,} from 'date-fns';
import {
  differenceInDays,
  differenceInHours,
  format,
  formatDistanceToNow,
  intervalToDuration,
  isBefore,
  type Duration,
} from 'date-fns';
import { round } from 'lodash-es';

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

export function getDuration(seconds: number) {
  const { hours, minutes } = intervalToDuration({
    start: 0,
    end: seconds * 1000,
  });
  // return formatDuration({ days, hours, minutes });
  let formatted = ``;
  if (hours) formatted += `${hours}h`;
  if (minutes) formatted += ` ${minutes}m`;
  return formatted;
}

/**
 * Format a timestamp (in milliseconds) as relative time if within a day,
 * otherwise as "MMM. d" (e.g. "Jan. 7").
 *
 * @param {number} timestampMs - The timestamp in milliseconds.
 * @returns {string} A formatted date string.
 */
export function formatTimestamp(timestampMs: number) {
  const date = new Date(timestampMs);
  const now = new Date();

  const daysDiff = differenceInDays(now, date);

  if (daysDiff < 1) {
    // Within 24 hours → show relative time
    return `${formatDistanceToNow(date, { addSuffix: true })}`;
  }

  // 1 day or more → show formatted date like "Jan. 7"
  return format(date, 'MMM. d');
}

export function getPlaybackPct(
  progress: number = 0,
  duration?: number,
  playbackPct?: number
) {
  if (playbackPct) return (1 - playbackPct) * 100;
  if (typeof duration === 'undefined' || duration <= 0) return 100;

  return round(((duration - progress) / duration) * 100, 2);
}
