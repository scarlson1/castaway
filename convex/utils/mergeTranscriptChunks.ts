import type {
  TranscriptionResponse,
  TranscriptSegment,
} from 'convex/utils/transcribeUrl';

// A single transcribed chunk. `duration` is the length of the audio that was
// submitted, as reported by the API: both `verbose_json` (TranscriptionVerbose)
// and `diarized_json` (TranscriptionDiarized) declare a required top level
// `duration` in openai/resources/audio/transcriptions. The `json`/`text`
// formats do not return one, so it stays optional here.
export interface ChunkTranscript {
  text: string;
  duration?: number;
  segments?: TranscriptSegment[];
}

export interface MergeTranscriptChunksOptions {
  // Byte length of every chunk, in the same order as `transcripts`.
  chunkByteLengths: number[];
  // Episode duration from the RSS feed (`episodes.durationSeconds`).
  durationSeconds?: number | null;
}

// 128 kbps MP3 ≈ 16000 bytes/sec. Last resort only: podcasts commonly ship at
// 64–96 kbps, where this constant advances the offset at half to three quarters
// of the real rate and every chunk after the first drifts earlier.
export const FALLBACK_BYTES_PER_SECOND = 16000;

// Sanity range for a derived bitrate: ~16 kbps to ~512 kbps. Anything outside
// it means the feed duration is bad metadata, not an unusual encoding.
const MIN_BYTES_PER_SECOND = 2000;
const MAX_BYTES_PER_SECOND = 64000;

const isPositiveNumber = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * Bytes per second of the downloaded audio, derived from the episode duration
 * the RSS feed already gave us. Exact for constant bitrate audio at any
 * bitrate, and needs no audio parsing. Returns null when the feed duration is
 * missing, zero, or implies an implausible bitrate.
 */
export const deriveBytesPerSecond = (
  totalBytes: number,
  durationSeconds?: number | null
): number | null => {
  if (!isPositiveNumber(durationSeconds) || totalBytes <= 0) return null;

  const bytesPerSecond = totalBytes / durationSeconds;
  if (
    bytesPerSecond < MIN_BYTES_PER_SECOND ||
    bytesPerSecond > MAX_BYTES_PER_SECOND
  ) {
    console.warn(
      `implausible bitrate from feed duration: ${Math.round(bytesPerSecond)} bytes/sec (${totalBytes} bytes over ${durationSeconds}s) — ignoring durationSeconds`
    );
    return null;
  }

  return bytesPerSecond;
};

/**
 * Stitches per-chunk transcripts back into one timeline.
 *
 * Each chunk is transcribed independently, so its segment timestamps restart at
 * zero and have to be shifted by the total duration of every preceding chunk.
 * That offset is resolved in priority order:
 *
 *  1. the chunk's own API reported `duration` — exact per chunk, and self
 *     correcting for variable bitrate audio
 *  2. `totalBytes / durationSeconds` from the feed — exact for constant bitrate
 *     at any bitrate
 *  3. a 128 kbps assumption, which is logged because it is a guess
 *
 * Deliberately never uses the last segment's `end` as the offset: whisper stops
 * emitting segments during silence, so that undershoots the real chunk duration
 * and drags every later chunk earlier.
 */
export const mergeTranscriptChunks = (
  transcripts: ChunkTranscript[],
  { chunkByteLengths, durationSeconds }: MergeTranscriptChunksOptions
): TranscriptionResponse => {
  const totalBytes = chunkByteLengths.reduce(
    (total, bytes) => total + bytes,
    0
  );
  const bytesPerSecond = deriveBytesPerSecond(totalBytes, durationSeconds);

  const merged: TranscriptSegment[] = [];
  let fullText = '';
  let offset = 0;
  let usedFallbackBitrate = false;

  transcripts.forEach((transcript, i) => {
    fullText += transcript.text + ' ';

    for (const seg of transcript.segments ?? []) {
      merged.push({
        id: seg.id,
        start: seg.start + offset,
        end: seg.end + offset,
        text: seg.text,
      });
    }

    if (isPositiveNumber(transcript.duration)) {
      offset += transcript.duration;
      return;
    }

    // Only the offset handed to a *following* chunk can drift, so a single
    // chunk episode never needs the warning.
    if (bytesPerSecond === null && i < transcripts.length - 1) {
      usedFallbackBitrate = true;
    }
    offset +=
      (chunkByteLengths[i] ?? 0) / (bytesPerSecond ?? FALLBACK_BYTES_PER_SECOND);
  });

  if (usedFallbackBitrate) {
    console.warn(
      'no API duration and no usable feed duration — chunk offsets estimated at 128 kbps, transcript timestamps may drift'
    );
  }

  return {
    text: fullText.trim(),
    segments: merged,
  };
};
