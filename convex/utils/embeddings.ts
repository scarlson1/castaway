import { embeddingModelName } from 'convex/agent/models';

export async function createEmbedding(
  text: string,
  { model = embeddingModelName, apiKey = process.env.OPENAI_API_KEY } = {}
): Promise<number[]> {
  if (!apiKey) throw new Error('OPENAI_API_KEY required');

  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, input: text }),
  });

  if (!resp.ok) {
    throw new Error(`Embedding error: ${resp.status} ${await resp.text()}`);
  }

  const json = await resp.json();

  if (!json.data || !json.data[0] || !json.data[0].embedding)
    throw new Error('Invalid embedding response');

  return json.data[0].embedding as number[];
  // return json.data[0].embedding;
}
