import { describe, expect, it } from 'vitest';
import { buildWindows } from '../utils/buildWindows';
import type { TranscriptSegment } from '../utils/transcribeUrl';

function seg(id: number, start: number, end: number, text: string): TranscriptSegment {
  return { id, start, end, text };
}

describe('buildWindows', () => {
  it('returns empty array for empty segments', () => {
    expect(buildWindows([])).toEqual([]);
  });

  it('returns a single window for a single short segment', () => {
    const segments = [seg(0, 0, 5, 'hello world')];
    const windows = buildWindows(segments, 12, 4);
    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({ start: 0, end: 5, text: 'hello world' });
  });

  it('window text includes segments that overlap the window boundary', () => {
    // segment spans 0–15, window is 0–12 → should be included
    const segments = [
      seg(0, 0, 8, 'first'),
      seg(1, 8, 15, 'second'),
    ];
    const windows = buildWindows(segments, 12, 4);
    // first window [0,12]: both segments overlap
    expect(windows[0].text).toContain('first');
    expect(windows[0].text).toContain('second');
  });

  it('excludes segments entirely outside the window', () => {
    const segments = [
      seg(0, 0, 5, 'early'),
      seg(1, 20, 25, 'late'),
    ];
    // window size 12, step 4 → first window [0,12]
    const windows = buildWindows(segments, 12, 4);
    expect(windows[0].text).toBe('early');
    expect(windows[0].text).not.toContain('late');
  });

  it('steps advance by stepSec', () => {
    // duration=20, windowSec=12, stepSec=4
    // t=0: [0,12], t=4: [4,16], t=8: [8,20] end===duration → break
    const segments = [
      seg(0, 0, 20, 'content'),
    ];
    const windows = buildWindows(segments, 12, 4);
    const starts = windows.map((w) => w.start);
    expect(starts).toEqual([0, 4, 8]);
  });

  it('last window end is clamped to segment duration', () => {
    const segments = [seg(0, 0, 10, 'text')];
    const windows = buildWindows(segments, 12, 4);
    const last = windows[windows.length - 1];
    expect(last.end).toBe(10);
  });

  it('stops after reaching duration — no duplicate terminal window', () => {
    const segments = [seg(0, 0, 12, 'text')];
    // duration = 12, windowSec = 12, stepSec = 4
    // t=0: window [0,12] → end === duration → break
    const windows = buildWindows(segments, 12, 4);
    expect(windows).toHaveLength(1);
  });

  it('respects custom windowSec and stepSec', () => {
    // duration=30, windowSec=10, stepSec=5
    // t=0:[0,10], t=5:[5,15], t=10:[10,20], t=15:[15,25], t=20:[20,30] end===duration → break
    const segments = [seg(0, 0, 30, 'content')];
    const windows = buildWindows(segments, 10, 5);
    const starts = windows.map((w) => w.start);
    expect(starts).toEqual([0, 5, 10, 15, 20]);
  });

  it('joins multiple overlapping segment texts with a space', () => {
    const segments = [
      seg(0, 0, 5, 'foo'),
      seg(1, 3, 8, 'bar'),
    ];
    const windows = buildWindows(segments, 12, 12);
    expect(windows[0].text).toBe('foo bar');
  });

  it('trims leading/trailing whitespace from window text', () => {
    const segments = [seg(0, 0, 5, '  spaced  ')];
    const windows = buildWindows(segments, 12, 4);
    expect(windows[0].text).toBe('spaced');
  });
});
