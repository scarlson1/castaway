import { describe, expect, it } from 'vitest';
import { mergeAdWindows } from '../utils/mergeWindows';
import type { ClassifiedWindow } from '../adSegments';

function adWindow(
  start: number,
  end: number,
  is_ad: boolean,
  confidence: number,
  text = 'ad text'
): ClassifiedWindow {
  return { start, end, text, is_ad, confidence, reason: '' };
}

describe('mergeAdWindows', () => {
  it('returns empty array when there are no windows', () => {
    expect(mergeAdWindows([])).toEqual([]);
  });

  it('returns empty array when no windows are ads', () => {
    const windows = [adWindow(0, 10, false, 0.9)];
    expect(mergeAdWindows(windows)).toEqual([]);
  });

  it('filters out windows with confidence below the threshold', () => {
    const windows = [adWindow(0, 10, true, 0.39)];
    expect(mergeAdWindows(windows)).toEqual([]);
  });

  it('includes windows at exactly the threshold', () => {
    // >= matches how recalibrateThreshold scores candidate thresholds
    // duration must be >= minDuration (5s default)
    const windows = [adWindow(0, 10, true, 0.4)];
    expect(mergeAdWindows(windows)).toHaveLength(1);
  });

  it('honors a calibrated threshold passed by the caller', () => {
    const windows = [adWindow(0, 10, true, 0.6)];
    // per-podcast threshold from podcastAdConfig overrides the 0.4 default
    expect(mergeAdWindows(windows, 5, 2, 0.7)).toEqual([]);
    expect(mergeAdWindows(windows, 5, 2, 0.6)).toHaveLength(1);
  });

  it('merges adjacent windows within mergeGap', () => {
    // gap between end=10 and start=11 is 1s, within default mergeGap=2
    const windows = [
      adWindow(0, 10, true, 0.8, 'part one'),
      adWindow(11, 20, true, 0.8, 'part two'),
    ];
    const result = mergeAdWindows(windows);
    expect(result).toHaveLength(1);
    expect(result[0].start).toBe(0);
    expect(result[0].end).toBe(20);
    expect(result[0].duration).toBe(20);
    expect(result[0].transcript).toContain('part one');
    expect(result[0].transcript).toContain('part two');
  });

  it('does not merge windows farther apart than mergeGap', () => {
    // gap of 5s > default mergeGap of 2s → separate segments
    const windows = [
      adWindow(0, 10, true, 0.8),
      adWindow(15, 25, true, 0.8),
    ];
    const result = mergeAdWindows(windows);
    expect(result).toHaveLength(2);
    expect(result[0].start).toBe(0);
    expect(result[1].start).toBe(15);
  });

  it('drops segments shorter than minDuration', () => {
    // single 3-second segment < default minDuration of 5s
    const windows = [adWindow(0, 3, true, 0.9)];
    expect(mergeAdWindows(windows)).toEqual([]);
  });

  it('keeps segments at exactly minDuration', () => {
    const windows = [adWindow(0, 5, true, 0.9)];
    expect(mergeAdWindows(windows)).toHaveLength(1);
  });

  it('averages confidence across merged windows', () => {
    const windows = [
      adWindow(0, 10, true, 0.6),
      adWindow(11, 20, true, 0.8),
    ];
    const result = mergeAdWindows(windows);
    // avg = (0.6 * 1 + 0.8) / 2 = 0.7
    expect(result[0].confidence).toBeCloseTo(0.7);
  });

  it('sorts unsorted windows by start time before merging', () => {
    const windows = [
      adWindow(15, 25, true, 0.8),
      adWindow(0, 10, true, 0.8),
    ];
    const result = mergeAdWindows(windows, 5, 2);
    expect(result[0].start).toBe(0);
    expect(result[1].start).toBe(15);
  });

  it('respects custom minDuration and mergeGap params', () => {
    // With mergeGap=10, the 5s gap between end=10 and start=15 should merge
    const windows = [
      adWindow(0, 10, true, 0.9),
      adWindow(15, 25, true, 0.9),
    ];
    const result = mergeAdWindows(windows, 3, 10);
    expect(result).toHaveLength(1);
    expect(result[0].end).toBe(25);
  });

  it('sets duration field correctly', () => {
    const windows = [adWindow(5, 20, true, 0.9)];
    const result = mergeAdWindows(windows);
    expect(result[0].duration).toBe(15);
  });

  it('trims transcript whitespace after concatenation', () => {
    const windows = [
      adWindow(0, 10, true, 0.9, 'intro ad '),
      adWindow(11, 20, true, 0.9, ' outro ad'),
    ];
    const result = mergeAdWindows(windows);
    expect(result[0].transcript).toBe('intro ad   outro ad');
  });
});
