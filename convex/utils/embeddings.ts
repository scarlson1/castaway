import type { Doc } from 'convex/_generated/dataModel';
import { embeddingModelName } from 'convex/agent/models';

interface EmbeddingResult {
  object: string; // "list",
  data: {
    object: string; // "embedding",
    index: number;
    embedding: number[];
  }[];
  model: string; // "text-embedding-3-small",
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export async function createEmbedding(
  input: string | string[],
  { model = embeddingModelName, apiKey = process.env.OPENAI_API_KEY } = {}
): Promise<EmbeddingResult['data']> {
  if (!apiKey) throw new Error('OPENAI_API_KEY required');

  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, input }),
  });

  if (!resp.ok) {
    throw new Error(`Embedding error: ${resp.status} ${await resp.text()}`);
  }

  const json = await resp.json();

  if (!json.data || !json.data[0] || !json.data[0].embedding)
    throw new Error('Invalid embedding response');

  // return json.data[0].embedding as number[];
  return json.data;
}

// TODO: use format embedding function similar to the following (not currently being used)
export function formatEpisodeEmbeddingText(episode: Doc<'episodes'>) {
  return [
    `Title: ${episode.title}`,
    episode.summary ? `Summary: ${episode.summary}` : '',
    episode.detailedSummary ? `Description: ${episode.detailedSummary}` : '',
    episode.keyTopics ? `Topics ${episode.keyTopics.join(', ')}` : '',
    // ep.showNotes ? `Notes: ${ep.showNotes}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 2000); // ⛔ hard cap for cost + speed
}
