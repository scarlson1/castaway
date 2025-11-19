import type { ClassifiedWindow, Window } from 'convex/adSegments';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function classifyWindowsBatch<T extends Record<string, any>>(
  windows: (Window & T)[]
): Promise<(ClassifiedWindow & T)[]> {
  const windowCount = windows.length;

  const system =
    `You are a classifier. You must output **pure JSON only** with no explanations.

CRITICAL REQUIREMENTS:
1. You MUST return exactly ${windowCount} items in the output array
2. The output array must have a 1:1 correspondence with the input array
3. Each item in the output must correspond to the item at the same index in the input

Input: an array of ${windowCount} transcript windows.
Output: an array of exactly ${windowCount} objects with the following schema:

[
  { "is_ad": boolean, "confidence": number (0–1), "reason": string },
  ...
]

Definitions:
- "ad" includes sponsorships, promotions, calls to action, discount codes, and brand/promo messages.
- Keep reason values concise (1-2 sentences max).
- Do not output anything outside the JSON array.
- The output array length MUST equal ${windowCount}`.trim();

  const user = `Classify each of the ${windowCount} windows below. Return exactly ${windowCount} classification results in a JSON array.

${JSON.stringify(
  windows.map((w, i) => ({
    index: i,
    start: w.start,
    end: w.end,
    text: w.text,
  })),
  null,
  2
)}

Remember: Return exactly ${windowCount} items in your JSON array.`;

  // Calculate dynamic max_tokens: ~150 tokens per window (conservative estimate)
  // Add buffer for array structure
  const estimatedTokens = Math.max(4000, windowCount * 150 + 500);

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    max_tokens: estimatedTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const raw = resp.choices[0].message.content?.trim() || '';

  // Try to extract JSON from markdown code blocks if present
  let jsonString = raw;
  const jsonMatch = raw.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1];
  }

  const parsed = JSON.parse(jsonString) as {
    is_ad: boolean;
    confidence: number;
    reason: string;
  }[];

  console.log(`parsed length: ${parsed.length} / ${windows.length}`);

  if (parsed.length !== windows.length) {
    console.warn(
      `WARNING: LLM returned ${parsed.length} results but expected ${windows.length}. Filling missing results with defaults.`
    );
  }

  return windows.map((w, i) => ({
    ...w,
    is_ad: parsed[i]?.is_ad ?? false,
    confidence: parsed[i]?.confidence ?? 0,
    reason: parsed[i]?.reason ?? 'Error classifying - missing result',
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
