import type { Window } from 'convex/adSegments';
import type { TranscriptSegment } from 'convex/utils/transcribeUrl';

export function buildWindows(
  segments: TranscriptSegment[],
  windowSec: number = 15,
  stepSec: number = 7.5
): Window[] {
  const duration = segments.at(-1)?.end ?? 0;
  const windows: Window[] = [];

  for (let t = 0; t < duration; t += stepSec) {
    const start = t;
    const end = Math.min(t + windowSec, duration);

    const text = segments
      .filter((s) => !(s.end <= start || s.start >= end))
      .map((s) => s.text)
      .join(' ')
      .trim();

    windows.push({ start, end, text });

    if (end === duration) break;
  }

  return windows;
}
