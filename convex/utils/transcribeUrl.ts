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
// TODO: transcribeUrl only compatible with which response formats ??

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeUrl(
  url: string,
  options: TranscribeOptions
): Promise<TranscriptionResponse> {
  const chunks = await fetchAndChunkAudio(url);
  console.log(`audio broken into ${chunks.length} chunks`);

  const transcripts: WhisperResponse[] = [];
  for (const c of chunks) {
    console.log(`transcribing chunk...`);
    transcripts.push(await transcribeChunk(c, options));
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

// break into segments less than 25MB transcribe limit
async function fetchAndChunkAudio(
  url: string,
  maxChunkBytes = 24 * 1024 * 1024 // 24MB for safety
): Promise<Uint8Array[]> {
  const res = await fetch(url);
  if (!res.ok || !res.body)
    throw new Error(
      `Failed to download audio: ${res.status} - ${await res.text()}`
    );

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
  });
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
