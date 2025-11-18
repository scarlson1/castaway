export type SegmentLabel = 'ad' | 'content';

export async function classifyTranscriptWindow(
  text: string,
  { model = 'gpt-4o-mini', apiKey = process.env.OPENAI_API_KEY } = {}
): Promise<SegmentLabel> {
  const body = {
    model,
    messages: [
      {
        role: 'system',
        content:
          "You classify transcript segments. Answer with only 'ad' or 'content'.",
      },
      {
        role: 'user',
        content: `Classify this segment: ${text}`,
      },
    ],
    temperature: 0,
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(`LLM classify error ${resp.status}: ${await resp.text()}`);
  }

  const json = await resp.json();
  return json.choices[0].message.content.trim().toLowerCase();
}

// USING OPENAI LIB:

// Use temperature: 0 to keep deterministic outputs.
// The system prompt forces strict JSON to make parsing reliable.

/**
 * Ask the LLM whether a given window is an ad.
 * Returns object: {is_ad: bool, confidence: float (0-1), reason: string}
//  */
// export async function classifyWindow(windowText) {
//   const system = `You are a classifier that answers ONLY with a compact JSON object.
// Return exactly: {"is_ad": true|false, "confidence": 0.00-1.00, "reason": "brief explanation"}.
// Confidence should be high when the text contains clear ad signals: "sponsored", "promo code", "visit", "use code", brand names with CTA, "brought to you by", etc. Do NOT include additional text.`;
//   const user = `Classify this transcript chunk as advertisement (promo/sponsorship) or not. Chunk:\n\n${windowText}`;

//   const resp = await openai.chat.completions.create({
//     model: "gpt-4o-mini", // choose the model you prefer
//     messages: [
//       { role: "system", content: system },
//       { role: "user", content: user },
//     ],
//     max_tokens: 200,
//     temperature: 0,
//   });

//   const reply = resp.choices[0].message.content.trim();
//   // Parse JSON robustly
//   try {
//     const parsed = JSON.parse(reply);
//     return parsed;
//   } catch (e) {
//     // If LLM returned stray text, try to extract JSON blob
//     const m = reply.match(/\{[\s\S]*\}/);
//     if (m) return JSON.parse(m[0]);
//     throw new Error("Could not parse LLM output: " + reply);
//   }
// }
