import { languageModelName } from 'convex/agent/models';
import OpenAI from 'openai';

// TODO: get model from env var

const openai = new OpenAI();

export interface EpisodeSummary {
  title: string;
  oneSentenceSummary: string;
  detailedSummary: string;
  keyTopics: string[];
  notableQuotes: string[];
}

const SYSTEM_PROMPT = `
You are a professional podcast editor.

Summarize podcast transcripts accurately and concisely.
Do not hallucinate facts or quotes.
Preserve speaker intent.
Write in neutral, factual tone.
Do not include ads.
`;

export async function summarizeTranscript(
  transcript: string
): Promise<EpisodeSummary> {
  const chunks = chunkTranscript(transcript);

  const chunkSummaries: string[] = [];

  for (const chunk of chunks) {
    // Retry logic could be added here
    const summary = await summarizeChunk(chunk);
    chunkSummaries.push(summary);
  }

  return reduceSummaries(chunkSummaries);
}

async function reduceSummaries(
  chunkSummaries: string[]
): Promise<EpisodeSummary> {
  const response = await openai.chat.completions.create({
    model: languageModelName, // 'gpt-4.1',
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `
Using the bullet-point notes below, produce a structured podcast summary.

Notes:
${chunkSummaries.join('\n')}

Return JSON with this exact schema:
{
  "title": string,
  "oneSentenceSummary": string,
  "detailedSummary": string,
  "keyTopics": string[],
  "notableQuotes": string[]
}
        `,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content!);
}

async function summarizeChunk(chunk: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: languageModelName, // 'gpt-4.1-mini',
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `
Extract the key points from the following transcript chunk.
Return concise bullet points only.

Transcript:
${chunk}
        `,
      },
    ],
  });

  return response.choices[0].message.content!;
}

const MAX_CHARS = 8_000;

function chunkTranscript(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + MAX_CHARS));
    start += MAX_CHARS;
  }

  return chunks;
}
