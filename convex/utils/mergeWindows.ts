// https://chatgpt.com/s/t_691b457aebcc819185798d4e08456e79
// TS version: https://chatgpt.com/s/t_691b47a68dac8191b4f47d388ebf05b4

import type { ClassifiedWindow, MergedAdSegment } from 'convex/adSegments';

export function mergeAdWindows(
  windows: ClassifiedWindow[],
  minDuration = 5,
  mergeGap = 2
): MergedAdSegment[] {
  const positives = windows.filter((w) => w.is_ad && w.confidence > 0.4);
  if (!positives.length) return [];

  positives.sort((a, b) => a.start - b.start);

  const segments: MergedAdSegment[] = [];
  let cur = {
    start: positives[0].start,
    end: positives[0].end,
    transcript: positives[0].text,
    confidence: positives[0].confidence,
    count: 1,
  };

  for (let i = 1; i < positives.length; i++) {
    const w = positives[i];

    if (w.start <= cur.end + mergeGap) {
      cur.end = Math.max(cur.end, w.end);
      cur.transcript += ' ' + w.text;
      cur.confidence =
        (cur.confidence * cur.count + w.confidence) / (cur.count + 1);
      cur.count++;
    } else {
      if (cur.end - cur.start >= minDuration)
        segments.push({
          start: cur.start,
          end: cur.end,
          duration: cur.end - cur.start,
          transcript: cur.transcript.trim(),
          confidence: cur.confidence,
        });

      cur = {
        start: w.start,
        end: w.end,
        transcript: w.text,
        confidence: w.confidence,
        count: 1,
      };
    }
  }

  if (cur.end - cur.start >= minDuration) {
    segments.push({
      start: cur.start,
      end: cur.end,
      duration: cur.end - cur.start,
      transcript: cur.transcript.trim(),
      confidence: cur.confidence,
    });
  }

  return segments;
}
