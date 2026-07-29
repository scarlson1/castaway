import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  deriveBytesPerSecond,
  mergeTranscriptChunks,
  type ChunkTranscript,
} from '../utils/mergeTranscriptChunks';

const MB = 1024 * 1024;

// bytes/sec for common podcast bitrates
const BYTES_PER_SEC_64_KBPS = 8000;
const BYTES_PER_SEC_128_KBPS = 16000;

function chunk(
  text: string,
  segments: Array<[number, number, string]>,
  duration?: number
): ChunkTranscript {
  return {
    text,
    ...(duration === undefined ? {} : { duration }),
    segments: segments.map(([start, end, segText], id) => ({
      id,
      start,
      end,
      text: segText,
    })),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('deriveBytesPerSecond', () => {
  it('derives the exact rate for 64 kbps audio', () => {
    // 24MB chunk of 64 kbps audio holds ~3146s
    const totalBytes = 24 * MB;
    const durationSeconds = totalBytes / BYTES_PER_SEC_64_KBPS;
    expect(deriveBytesPerSecond(totalBytes, durationSeconds)).toBeCloseTo(
      BYTES_PER_SEC_64_KBPS,
      6
    );
  });

  it('returns null for a missing, null, zero, or negative duration', () => {
    expect(deriveBytesPerSecond(24 * MB, undefined)).toBeNull();
    expect(deriveBytesPerSecond(24 * MB, null)).toBeNull();
    expect(deriveBytesPerSecond(24 * MB, 0)).toBeNull();
    expect(deriveBytesPerSecond(24 * MB, -1800)).toBeNull();
    expect(deriveBytesPerSecond(24 * MB, NaN)).toBeNull();
  });

  it('returns null when there are no bytes', () => {
    expect(deriveBytesPerSecond(0, 1800)).toBeNull();
  });

  it('rejects an implausibly low bitrate from bad feed metadata', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // duration in milliseconds by mistake → ~13 bytes/sec
    expect(deriveBytesPerSecond(24 * MB, 1_800_000)).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('rejects an implausibly high bitrate from bad feed metadata', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // duration in minutes by mistake → ~840_000 bytes/sec
    expect(deriveBytesPerSecond(24 * MB, 30)).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('mergeTranscriptChunks', () => {
  it('returns an empty transcript for no chunks', () => {
    expect(mergeTranscriptChunks([], { chunkByteLengths: [] })).toEqual({
      text: '',
      segments: [],
    });
  });

  it('leaves a single chunk untouched and never warns about drift', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const merged = mergeTranscriptChunks(
      [chunk('hello world', [[0, 5, 'hello'], [5, 11, 'world']])],
      { chunkByteLengths: [12 * MB] }
    );

    expect(merged.text).toBe('hello world');
    expect(merged.segments).toEqual([
      { id: 0, start: 0, end: 5, text: 'hello' },
      { id: 1, start: 5, end: 11, text: 'world' },
    ]);
    // nothing follows the only chunk, so the missing duration cannot drift
    expect(warn).not.toHaveBeenCalled();
  });

  it('offsets by the real duration for 64 kbps audio (the reported bug)', () => {
    // two 24MB chunks of 64 kbps audio: each holds ~3145.7s, not the 1572.9s a
    // hardcoded 128 kbps assumption would give
    const chunkBytes = 24 * MB;
    const chunkSeconds = chunkBytes / BYTES_PER_SEC_64_KBPS;
    const merged = mergeTranscriptChunks(
      [
        chunk('first', [[0, 10, 'a']]),
        chunk('second', [[0, 10, 'b']]),
      ],
      {
        chunkByteLengths: [chunkBytes, chunkBytes],
        durationSeconds: (2 * chunkBytes) / BYTES_PER_SEC_64_KBPS,
      }
    );

    expect(merged.segments?.[0]).toEqual({
      id: 0,
      start: 0,
      end: 10,
      text: 'a',
    });
    expect(merged.segments?.[1].start).toBeCloseTo(chunkSeconds, 6);
    expect(merged.segments?.[1].end).toBeCloseTo(chunkSeconds + 10, 6);
    // the 128 kbps assumption would have put it here — ~26 minutes early
    expect(merged.segments?.[1].start).not.toBeCloseTo(
      chunkBytes / BYTES_PER_SEC_128_KBPS,
      6
    );
  });

  it('offsets by the real duration for 128 kbps audio', () => {
    const chunkBytes = 24 * MB;
    const chunkSeconds = chunkBytes / BYTES_PER_SEC_128_KBPS;
    const merged = mergeTranscriptChunks(
      [
        chunk('first', [[0, 10, 'a']]),
        chunk('second', [[0, 10, 'b']]),
      ],
      {
        chunkByteLengths: [chunkBytes, chunkBytes],
        durationSeconds: (2 * chunkBytes) / BYTES_PER_SEC_128_KBPS,
      }
    );

    expect(merged.segments?.[1].start).toBeCloseTo(chunkSeconds, 6);
  });

  it('accumulates offsets across three chunks without compounding drift', () => {
    const chunkBytes = 10 * MB;
    const lastChunkBytes = 4 * MB;
    const totalBytes = 2 * chunkBytes + lastChunkBytes;
    const merged = mergeTranscriptChunks(
      [
        chunk('one', [[0, 5, 'a']]),
        chunk('two', [[0, 5, 'b']]),
        chunk('three', [[0, 5, 'c']]),
      ],
      {
        chunkByteLengths: [chunkBytes, chunkBytes, lastChunkBytes],
        durationSeconds: totalBytes / BYTES_PER_SEC_64_KBPS,
      }
    );

    expect(merged.segments?.[1].start).toBeCloseTo(
      chunkBytes / BYTES_PER_SEC_64_KBPS,
      6
    );
    expect(merged.segments?.[2].start).toBeCloseTo(
      (2 * chunkBytes) / BYTES_PER_SEC_64_KBPS,
      6
    );
    expect(merged.text).toBe('one two three');
  });

  it('prefers the API reported duration over the feed derived rate', () => {
    const chunkBytes = 24 * MB;
    const merged = mergeTranscriptChunks(
      [
        chunk('first', [[0, 10, 'a']], 2000),
        chunk('second', [[0, 10, 'b']], 1000),
      ],
      {
        // feed duration says 128 kbps → would advance by 1572.9s
        chunkByteLengths: [chunkBytes, chunkBytes],
        durationSeconds: (2 * chunkBytes) / BYTES_PER_SEC_128_KBPS,
      }
    );

    expect(merged.segments?.[1].start).toBe(2000);
    expect(merged.segments?.[1].end).toBe(2010);
  });

  it('uses the API duration when there is no feed duration at all', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const merged = mergeTranscriptChunks(
      [
        chunk('first', [[0, 10, 'a']], 1800),
        chunk('second', [[0, 10, 'b']], 1800),
      ],
      { chunkByteLengths: [24 * MB, 24 * MB] }
    );

    expect(merged.segments?.[1].start).toBe(1800);
    expect(warn).not.toHaveBeenCalled();
  });

  it('mixes API durations and the derived rate per chunk', () => {
    const chunkBytes = 12 * MB;
    const merged = mergeTranscriptChunks(
      [
        // API duration present → used verbatim (self corrects for VBR)
        chunk('one', [[0, 5, 'a']], 1000),
        // no API duration → falls back to the feed derived rate
        chunk('two', [[0, 5, 'b']]),
        chunk('three', [[0, 5, 'c']]),
      ],
      {
        chunkByteLengths: [chunkBytes, chunkBytes, chunkBytes],
        durationSeconds: (3 * chunkBytes) / BYTES_PER_SEC_64_KBPS,
      }
    );

    const derivedChunkSeconds = chunkBytes / BYTES_PER_SEC_64_KBPS;
    expect(merged.segments?.[1].start).toBe(1000);
    expect(merged.segments?.[2].start).toBeCloseTo(
      1000 + derivedChunkSeconds,
      6
    );
  });

  it('falls back to 128 kbps and warns when no duration is available', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chunkBytes = 24 * MB;
    const merged = mergeTranscriptChunks(
      [
        chunk('first', [[0, 10, 'a']]),
        chunk('second', [[0, 10, 'b']]),
      ],
      { chunkByteLengths: [chunkBytes, chunkBytes] }
    );

    expect(merged.segments?.[1].start).toBeCloseTo(
      chunkBytes / BYTES_PER_SEC_128_KBPS,
      6
    );
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('128 kbps');
  });

  it('falls back to 128 kbps when the feed duration is implausible', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chunkBytes = 24 * MB;
    const merged = mergeTranscriptChunks(
      [
        chunk('first', [[0, 10, 'a']]),
        chunk('second', [[0, 10, 'b']]),
      ],
      // duration in ms rather than seconds
      { chunkByteLengths: [chunkBytes, chunkBytes], durationSeconds: 3_600_000 }
    );

    expect(merged.segments?.[1].start).toBeCloseTo(
      chunkBytes / BYTES_PER_SEC_128_KBPS,
      6
    );
    // one warning for the bad metadata, one for the estimated offsets
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('warns only once no matter how many chunks fall back', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mergeTranscriptChunks(
      [
        chunk('one', [[0, 5, 'a']]),
        chunk('two', [[0, 5, 'b']]),
        chunk('three', [[0, 5, 'c']]),
        chunk('four', [[0, 5, 'd']]),
      ],
      { chunkByteLengths: [8 * MB, 8 * MB, 8 * MB, 8 * MB] }
    );

    expect(warn).toHaveBeenCalledOnce();
  });

  it('still advances the offset for a chunk that produced no segments', () => {
    // whisper emits nothing for a chunk that is entirely music or silence; the
    // following chunk must still be pushed out by the full chunk duration
    const chunkBytes = 10 * MB;
    const merged = mergeTranscriptChunks(
      [
        { text: '', segments: [] },
        chunk('after the silence', [[0, 5, 'a']]),
      ],
      {
        chunkByteLengths: [chunkBytes, chunkBytes],
        durationSeconds: (2 * chunkBytes) / BYTES_PER_SEC_64_KBPS,
      }
    );

    expect(merged.segments).toHaveLength(1);
    expect(merged.segments?.[0].start).toBeCloseTo(
      chunkBytes / BYTES_PER_SEC_64_KBPS,
      6
    );
  });

  it('ignores an undefined segments array and joins the text', () => {
    const merged = mergeTranscriptChunks(
      [{ text: 'plain json response' }, { text: 'second one', duration: 60 }],
      { chunkByteLengths: [1 * MB, 1 * MB], durationSeconds: 300 }
    );

    expect(merged.text).toBe('plain json response second one');
    expect(merged.segments).toEqual([]);
  });

  it('does not use the last segment end as the offset', () => {
    // whisper stopped emitting at 100s but the chunk really runs ~1310s
    const chunkBytes = 10 * MB;
    const merged = mergeTranscriptChunks(
      [
        chunk('first', [[0, 100, 'a']]),
        chunk('second', [[0, 10, 'b']]),
      ],
      {
        chunkByteLengths: [chunkBytes, chunkBytes],
        durationSeconds: (2 * chunkBytes) / BYTES_PER_SEC_64_KBPS,
      }
    );

    expect(merged.segments?.[1].start).not.toBe(100);
    expect(merged.segments?.[1].start).toBeCloseTo(
      chunkBytes / BYTES_PER_SEC_64_KBPS,
      6
    );
  });
});
