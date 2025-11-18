export async function createEmbedding(
  text: string,
  { model = 'text-embedding-3-small', apiKey = process.env.OPENAI_API_KEY } = {}
): Promise<number[]> {
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
  return json.data[0].embedding;
}
