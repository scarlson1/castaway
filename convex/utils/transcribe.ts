// TODO: delete - use transcribeUrl instead (handles 25MB issue)

import type {
  TranscribeOptions,
  TranscriptionResponse,
} from 'convex/utils/transcribeUrl';

// Node 18+ provides built-in fetch, FormData, File, Blob, etc.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Download audio from a remote URL and return as a Blob.
 */
async function fetchAudioAsBlob(audioUrl: string): Promise<Blob> {
  const resp = await fetch(audioUrl);
  if (!resp.ok) {
    throw new Error(
      `Failed to download audio: ${resp.status} ${await resp.text()}`
    );
  }
  const arrayBuffer = await resp.arrayBuffer();
  const contentType = resp.headers.get('content-type') || 'audio/mpeg';

  return new Blob([arrayBuffer], { type: contentType });
}

// TODO: better typing
// https://platform.openai.com/docs/guides/speech-to-text?lang=curl#transcriptions
// some models don't support all response types

/**
 * Transcribe audio from a URL using OpenAI Whisper.
 * limit of 25MB --> need to chunk if larger
 */
export async function transcribeFromUrl(
  audioUrl: string,
  {
    model = 'whisper-1',
    language = 'en',
    responseFormat = 'verbose_json',
  }: TranscribeOptions
): Promise<TranscriptionResponse> {
  const blob = await fetchAudioAsBlob(audioUrl);

  const form = new FormData();
  form.append('file', blob, 'audiofile'); // filename required by API
  form.append('model', model);
  form.append('language', language);
  form.append('response_format', responseFormat); // If we want timestamps/segments

  console.log(
    `requesting transcription from OpenAI [model: ${model}; format: ${responseFormat}]... `
  );
  // TODO: if using node, replace with openai lib
  const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      // DO NOT set Content-Type manually — FormData handles it
    },
    body: form,
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Transcription failed: ${resp.status} ${txt}`);
  }
  // data will contain `text` at minimum. If you requested a verbose format you'll get segmented timings.
  return await resp.json();
}

// export async function transcriptFromUrl(
//   url: string,
//   options: TranscribeOptions = {}
// ) {
//   // 1. Download
//   const tmpFile = await downloadToTemp(url);

//   try {
//     // 2. Compute chunk size
//     const chunkDuration = estimateChunkDurationForWhisper(tmpFile);

//     // 3. Split
//     const chunks = splitAudioFile(tmpFile, chunkDuration);

//     // 4. Transcribe
//     const segments = await transcribeChunks(chunks, options);

//     return segments;
//   } finally {
//     // Clean up ALWAYS, even if an error occurs
//     cleanupFiles([
//       tmpFile,
//       ...readdirSync('/tmp')
//         .filter((f) => f.startsWith('chunk_'))
//         .map((f) => `/tmp/${f}`),
//     ]);
//   }
// }

// // Download URL → Temp File (streaming, no RAM spikes)
// async function downloadToTemp(url: string): Promise<string> {
//   const temp = path.join('/tmp', `audio_${Date.now()}.mp3`);
//   const res = await fetch(url);

//   if (!res.ok || !res.body) {
//     throw new Error(`Failed to download audio: ${res.statusText}`);
//   }

//   const fileStream = createWriteStream(temp);
//   // await new Promise((resolve, reject) => {
//   //   res.body?.pipe(fileStream);
//   //   res.body?.on('error', reject);
//   //   fileStream.on('finish', resolve);
//   // });
//   const reader = res.body.getReader();

//   try {
//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;
//       fileStream.write(Buffer.from(value));
//     }
//     fileStream.end();
//     await new Promise<void>((resolve) =>
//       fileStream.on('finish', () => resolve())
//     );
//   } finally {
//     reader.releaseLock();
//   }

//   return temp;
// }

// // Compute Chunk Duration Based on Size + ffprobe Duration
// export function estimateChunkDurationForWhisper(filePath: string, maxMB = 25) {
//   const fileSizeMB = statSync(filePath).size / (1024 * 1024);

//   const durationSec = parseFloat(
//     execSync(
//       `ffprobe -v error -show_entries format=duration -of csv=p=0 ${filePath}`
//     )
//       .toString()
//       .trim()
//   );

//   const mbPerSec = fileSizeMB / durationSec;
//   const chunkDuration = Math.floor(maxMB / mbPerSec);

//   return Math.max(chunkDuration, 15); // minimum sanity window
// }

// // ffmpeg: Split file into Whisper-safe chunks
// function splitAudioFile(filePath: string, chunkDuration: number): string[] {
//   const dir = '/tmp';
//   const outputPattern = path.join(dir, 'chunk_%03d.mp3');

//   execSync(
//     `ffmpeg -y -i ${filePath} -f segment -segment_time ${chunkDuration} -segment_overlap 1 ${outputPattern}`
//   );

//   return readdirSync(dir)
//     .filter((f) => f.startsWith('chunk_') && f.endsWith('.mp3'))
//     .map((f) => path.join(dir, f));
// }

// export async function transcribeFile(
//   filePath: string,
//   {
//     model = 'whisper-1',
//     language = 'en',
//     responseFormat = 'verbose_json',
//   }: TranscribeOptions
// ): Promise<TranscriptionResponse> {
//   const fileBuffer = await readFile(filePath);
//   const blob = new Blob([fileBuffer], { type: 'audio/mpeg' });

//   const form = new FormData();
//   form.append('file', blob, path.basename(filePath));
//   form.append('model', model);
//   form.append('language', language);
//   form.append('response_format', responseFormat); // If we want timestamps/segments

//   const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
//     method: 'POST',
//     headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
//     body: form,
//   });

//   if (!resp.ok) throw new Error(`Transcription failed: ${await resp.text()}`);

//   return (await resp.json()) as TranscriptionResponse;
// }

// async function transcribeChunks(
//   chunkPaths: string[],
//   options: TranscribeOptions
// ) {
//   const result: TranscriptSegment[] = [];
//   let text: string = '';
//   let offset = 0;

//   for (const chunk of chunkPaths) {
//     const { segments, text: chunkText } = await transcribeFile(chunk, options);
//     text += chunkText;
//     if (!segments) {
//       offset += 0;
//       continue;
//     }

//     for (const s of segments) {
//       result.push({
//         start: s.start + offset,
//         end: s.end + offset,
//         text: s.text,
//         id: s.id,
//       });
//     }

//     const last = segments.at(-1);
//     if (last) {
//       offset += last.end; // push offset forward
//     }
//   }

//   return { segments: result, text };
// }

// function safeDelete(filePath: string) {
//   try {
//     if (existsSync(filePath)) unlinkSync(filePath);
//   } catch (err) {
//     console.warn('Failed to delete temp file:', filePath, err);
//   }
// }

// function cleanupFiles(paths: string[]) {
//   for (const p of paths) safeDelete(p);
// }
