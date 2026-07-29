import { mergeTranscriptChunks } from 'convex/utils/mergeTranscriptChunks';
import OpenAI from 'openai';
import type { AudioResponseFormat } from 'openai/resources/index.mjs';

export interface TranscriptSegment {
  id: number | string;
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface TranscriptionResponse {
  text: string;
  segments?: TranscriptSegment[];
}

interface WhisperResponse {
  text: string;
  // duration of the submitted audio in seconds. Returned by `verbose_json` and
  // `diarized_json`, absent from `json`/`text`.
  duration?: number;
  segments?: Array<{
    id: number | string;
    start: number;
    end: number;
    text: string;
    speaker?: string;
  }>;
}

// https://developers.openai.com/api/docs/guides/speech-to-text#transcriptions

// export type OpenAITranscribeModel =
//   | 'gpt-4o-transcribe-diarize'
//   | 'gpt-4o-mini-transcribe'
//   | 'gpt-4o-transcribe'
//   | 'whisper-1';

interface GbtTranscribeDiarizeOptions {
  model: 'gpt-4o-transcribe-diarize';
  responseFormat: 'json' | 'text' | 'diarized_json';
  // extra_body: {
  //   known_speaker_names: ["agent"],
  //   known_speaker_references: ["data:audio/wav;base64," + agentRef],
  // },
}
interface GbtMiniTranscribeOptions {
  model: 'gpt-4o-mini-transcribe';
  responseFormat: 'json' | 'text';
}
interface GbtTranscribeOptions {
  model: 'gpt-4o-transcribe';
  responseFormat: 'json' | 'text';
}
interface WhisperOptions {
  model: 'whisper-1';
  responseFormat?: 'json' | 'text' | 'diarized_json' | 'verbose_json' | 'vtt';
  // timestamp_granularities: ["word"]
}
type GroqModel = 'whisper-large-v3-turbo' | 'whisper-large-v3';
interface GroqOptions {
  model: GroqModel;
  responseFormat?: 'json' | 'verbose_json' | 'text';
}

type TranscribeOptions = (
  | GbtTranscribeDiarizeOptions
  | GbtMiniTranscribeOptions
  | GbtTranscribeOptions
  | WhisperOptions
  | GroqOptions
) & {
  language?: string;
  // Episode duration from the RSS feed (`episodes.durationSeconds`). Used only
  // to work out how far to advance the timeline between chunks — never sent to
  // the transcription API.
  durationSeconds?: number | null;
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// fetches audio from url --> breaks into chunks <25MB --> transcribe --> combine transcribed chunks into array of segments ([{ id, start, end, text }])

export async function transcribeUrl(
  url: string,
  options: TranscribeOptions,
): Promise<TranscriptionResponse> {
  // break audio into chunks of < 25MB (override for diarization (second based - 1400))
  const isDiarize = options?.model === 'gpt-4o-transcribe-diarize';

  let chunkSize = isDiarize ? 10 * 1024 * 1024 : 24 * 1024 * 1024;
  const chunks = await fetchAndChunkAudio(url, chunkSize);
  console.log(`audio broken into ${chunks.length} chunks`);

  // transcribe each chunk
  const transcripts: WhisperResponse[] = [];
  for (const c of chunks) {
    console.log(`transcribing chunk...`);
    transcripts.push(await transcribeChunk(c, options));
  }
  console.log(`finished transcribing chunks`);

  // Merge chunks into array of timestamps and text (transcript)
  return mergeTranscriptChunks(transcripts, {
    chunkByteLengths: chunks.map((c) => c.byteLength),
    durationSeconds: options.durationSeconds,
  });
}

/*
TODO: implement second based chunking for diarization transcription (1400 second limit)? and stick with byte for regular (25MB limit)

It depends on the bitrate. Common podcast bitrates:

Bitrate	Bytes/sec	1400s =
64 kbps	8,000 B/s	~11.2 MB
96 kbps	12,000 B/s	~16.8 MB
128 kbps	16,000 B/s	~22.4 MB
The erroring episode was ~1573 seconds and fit in one <24 MB chunk, so its bitrate was roughly 122 kbps — right at the boundary where 24 MB ≈ 1572s.

To guarantee ≤ 1400 seconds per chunk at 128 kbps you'd need ~22 MB. But that still breaks at lower bitrates for very long episodes. The only robust fix is to chunk by duration, not bytes — which requires parsing the audio header to get the bitrate before chunking.

The pragmatic safe choice is ~10 MB (handles up to ~156 kbps for 1400s, and most speech podcasts are 64–128 kbps, so worst case you get 2–3 chunks instead of 1). Want me to change maxChunkBytes to 10 MB, or implement duration-based chunking instead?
*/

// break into segments less than 25MB transcribe limit
// 1400 second limit for the transcribe with diarization model
async function fetchAndChunkAudio(
  url: string,
  maxChunkBytes = 24 * 1024 * 1024, // 24MB for safety
): Promise<Uint8Array[]> {
  const res = await fetch(url);
  if (!res.ok || !res.body)
    throw new Error(
      `Failed to download audio: ${res.status} - ${await res.text()}`,
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
        offset,
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

// async function transcribeChunk(
//   chunk: Uint8Array,
//   {
//     model = 'whisper-1',
//     language = 'en',
//     responseFormat, // = 'verbose_json'
//     ...rest
//   }: TranscribeOptions,
// ): Promise<WhisperResponse> {
//   const isDiarize = model === 'gpt-4o-transcribe-diarize';
//   const format =
//     responseFormat ?? (isDiarize ? 'diarized_json' : 'verbose_json');

//   const llmClient =
//     model === 'whisper-large-v3' || model === 'whisper-large-v3-turbo'
//       ? groqClient
//       : client;

//   return await llmClient.audio.transcriptions.create({
//     model,
//     file: await toReadableFile(chunk, 'audio.mp3'),
//     response_format: format,
//     language,
//     ...(isDiarize && { chunking_strategy: 'auto' }),
//     ...rest,
//   });
// }

// try grok until rate limit kicks in, then callback on open AI
async function transcribeChunk(
  chunk: Uint8Array,
  options: TranscribeOptions,
): Promise<WhisperResponse> {
  const {
    model = 'whisper-1',
    language = 'en',
    responseFormat,
    // pulled out so it does not reach the API via ...rest — it only informs
    // how chunk timestamps are stitched back together
    durationSeconds: _durationSeconds,
    ...rest
  } = options;
  const isDiarize = model === 'gpt-4o-transcribe-diarize';
  const isGroq =
    model === 'whisper-large-v3' || model === 'whisper-large-v3-turbo';

  const doTranscribe = async (
    useClient: OpenAI,
    useModel: string,
    format: AudioResponseFormat,
  ) =>
    useClient.audio.transcriptions.create({
      model: useModel,
      file: await toReadableFile(chunk, 'audio.mp3'),
      response_format: format,
      language,
      ...(isDiarize && { chunking_strategy: 'auto' }),
      ...rest,
    });

  if (isGroq) {
    const format = responseFormat ?? 'verbose_json';
    try {
      return await doTranscribe(groqClient, model, format);
    } catch (err: any) {
      if (err?.status === 429) {
        console.warn('Groq 429 — falling back to OpenAI whisper-1');
        return await doTranscribe(client, 'whisper-1', 'verbose_json');
      }
      throw err;
    }
  }

  const format =
    responseFormat ?? (isDiarize ? 'diarized_json' : 'verbose_json');
  return doTranscribe(client, model, format);
}

// Convert bytes → File object for Whisper
async function toReadableFile(
  bytes: Uint8Array,
  filename: string,
): Promise<File> {
  // Create a new Uint8Array to ensure proper type compatibility
  const buffer = new Uint8Array(bytes);
  return new File([buffer], filename, { type: 'audio/mpeg' });
}
