import type { ClassifiedWindow, Window } from 'convex/adSegments';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function classifyWindowsBatch(
  windows: Window[]
): Promise<ClassifiedWindow[]> {
  const system =
    `You are a classifier. You must output **pure JSON only** with no explanations.

Input: an array of transcript windows.
Output: each of the objects in the provided windows (corresponding to each object in the input array) with the following schema:

[
  { "is_ad": boolean, "confidence": number (0–1), "reason": string },
  ...
]

Definitions:
- "ad" includes sponsorships, promotions, calls to action, discount codes, and brand/promo messages.
- Keep values concise.
- Do not output anything outside the JSON array.
- there should be a 1:1 mapping of the provided windows and your classification array
`.trim();

  const user = JSON.stringify(
    windows.map((w) => ({
      start: w.start,
      end: w.end,
      text: w.text,
    }))
  );
  // console.log('system message: ', system);
  // console.log('user input: ', user);

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    max_tokens: 2500,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const raw = resp.choices[0].message.content?.trim() || '';

  const parsed = JSON.parse(raw) as {
    is_ad: boolean;
    confidence: number;
    reason: string;
  }[];
  console.log(`parsed length: ${parsed.length} / ${windows.length}`);
  console.log('parsed response 0: ', parsed[0]);

  return windows.map((w, i) => ({
    ...w,
    is_ad: parsed[i]?.is_ad ?? false,
    confidence: parsed[i]?.confidence ?? 0,
    reason: parsed[i]?.reason ?? 'Error classifying',
  }));
}

// export interface Window {
//   i: number;
//   text: string;
// }

// export interface BatchClassification {
//   i: number;
//   label: 'ad' | 'content';
// }

// export async function classifyWindowsBatch(
//   windows: Window[],
//   model = 'gpt-4o-mini',
//   apiKey = process.env.OPENAI_API_KEY as string
// ): Promise<BatchClassification[]> {
//   const prompt = windows
//     .map((w) => `### Window ${w.i}\n${w.text}`)
//     .join('\n\n');

//   const body = {
//     model,
//     messages: [
//       {
//         role: 'system',
//         content: "Return JSON: [{ i: number, label: 'ad' | 'content' }]",
//       },
//       {
//         role: 'user',
//         content: prompt,
//       },
//     ],
//     temperature: 0,
//   };

//   const resp = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${apiKey}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(body),
//   });

//   const json = await resp.json();
//   return JSON.parse(json.choices[0].message.content);
// }
