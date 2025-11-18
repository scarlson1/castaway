'use node';

import OpenAI from 'openai';

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResponse {
  text: string;
  segments?: TranscriptSegment[];
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface WhisperResponse {
  text: string;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

export type OpenAITranscribeModel =
  | 'gpt-4o-transcribe-diarize'
  | 'gpt-4o-mini-transcribe'
  | 'gpt-4o-transcribe'
  | 'whisper-1';

export interface TranscribeOptions {
  model?: OpenAITranscribeModel;
  language?: string;
  responseFormat?: 'json' | 'text' | 'diarized_json' | 'verbose_json' | 'vtt';
}

export async function transcribeUrl(
  url: string,
  options: TranscribeOptions
): Promise<TranscriptionResponse> {
  const chunks = await fetchAndChunkAudio(url);
  console.log(`audio broken into ${chunks.length} chunks`);

  const transcripts: WhisperResponse[] = [];
  for (const c of chunks) {
    console.log(`processing chunk...`);
    // transcripts.push(await transcribeChunk(c, options));
    transcripts.push(await transcribeChunkWithFetch(c, {}));
  }
  console.log(`finished transcribing chunks`);

  // Merge timestamps and text
  let offset = 0;
  const merged: TranscriptSegment[] = [];
  let fullText = '';

  for (const t of transcripts) {
    fullText += t.text + ' ';
    if (t.segments) {
      for (const seg of t.segments) {
        merged.push({
          id: seg.id,
          start: seg.start + offset,
          end: seg.end + offset,
          text: seg.text,
        });
      }
      const last = t.segments.at(-1);
      if (last) offset += last.end;
    }
  }

  return {
    text: fullText.trim(),
    segments: merged,
  };
}

async function fetchAndChunkAudio(
  url: string,
  maxChunkBytes = 24 * 1024 * 1024 // 24MB for safety
): Promise<Uint8Array[]> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error('Failed to download audio.');

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];

  let current = new Uint8Array(maxChunkBytes);
  let offset = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    let input = value;
    let inputOffset = 0;

    while (inputOffset < input.length) {
      const spaceLeft = maxChunkBytes - offset;
      const bytesToCopy = Math.min(spaceLeft, input.length - inputOffset);

      current.set(
        input.subarray(inputOffset, inputOffset + bytesToCopy),
        offset
      );
      offset += bytesToCopy;
      inputOffset += bytesToCopy;

      if (offset >= maxChunkBytes) {
        chunks.push(current);
        current = new Uint8Array(maxChunkBytes);
        offset = 0;
      }
    }
  }

  if (offset > 0) {
    chunks.push(current.slice(0, offset));
  }

  return chunks;
}

async function transcribeChunk(
  chunk: Uint8Array,
  {
    model = 'whisper-1',
    language = 'en',
    responseFormat = 'verbose_json',
  }: TranscribeOptions
): Promise<WhisperResponse> {
  return await client.audio.transcriptions.create({
    model,
    file: await toReadableFile(chunk, 'audio.mp3'),
    response_format: responseFormat,
    language,
  }); //) as WhisperResponse;
}

// Convert bytes → File object for Whisper
async function toReadableFile(
  bytes: Uint8Array,
  filename: string
): Promise<File> {
  // Create a new Uint8Array to ensure proper type compatibility
  const buffer = new Uint8Array(bytes);
  return new File([buffer], filename, { type: 'audio/mpeg' });
}

// ATTEMPT USING FETCH INSTEAD OF OPEN AI CLIENT

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Transcribe an audio chunk (Uint8Array) by POSTing multipart/form-data to OpenAI.
 * Uses Blob instead of File for Convex compatibility.
 */
export async function transcribeChunkWithFetch(
  chunk: Uint8Array,
  {
    model = 'whisper-1',
    language = 'en',
    responseFormat = 'verbose_json',
    maxAttempts = 3,
    backoffMs = 1000,
  }: TranscribeOptions & { maxAttempts?: number; backoffMs?: number }
) {
  // const maxAttempts = opts?.maxAttempts ?? 3;
  // const baseBackoff = opts?.backoffMs ?? 1000;
  // const response_format = opts?.response_format ?? "verbose_json";

  // Prepare form data
  // Using Blob (works in Node 18 / Convex). Do NOT rely on `File`.
  const buffer = new Uint8Array(chunk);
  const blob = new Blob([buffer], { type: 'audio/mpeg' }); // or audio/webm, adjust if needed

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const form = new FormData();
      // Name the file; extension helps server guess audio type
      form.append('file', blob, 'chunk.mp3');
      form.append('model', model);
      form.append('response_format', responseFormat);
      form.append('language', language);

      const resp = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          // DO NOT set Content-Type header — the browser/Fetch sets the multipart boundary
        },
        body: form,
        // no manual timeout here — Convex may have its own action timeout
      });

      if (!resp.ok) {
        const body = await resp.text().catch(() => '<unreadable body>');
        // For 4xx/5xx show the body (OpenAI typically returns JSON error)
        const err = new Error(
          `OpenAI transcription failed [status=${resp.status}]: ${body}`
        );
        // If it's a 5xx server error, we might retry
        if (resp.status >= 500 && attempt < maxAttempts) {
          const wait = backoffMs * Math.pow(2, attempt - 1);
          console.warn(
            `transcription attempt ${attempt} failed (status ${resp.status}), retry after ${wait}ms...`
          );
          await sleep(wait);
          continue;
        }
        throw err;
      }

      // Parse JSON (verbose_json or text)
      const json = await resp.json();
      return json; // contains segments for verbose_json
    } catch (e) {
      // Network or parse error
      if (attempt < maxAttempts) {
        const wait = backoffMs * Math.pow(2, attempt - 1);
        console.warn(
          `transcription attempt ${attempt} error: ${
            (e as Error).message
          }; retry in ${wait}ms`
        );
        console.log(e);
        await sleep(wait);
        continue;
      }
      throw e;
    }
  }
}
