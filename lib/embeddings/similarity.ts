export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

export interface Neighbor {
  category: string;
  similarity: number;
  tags: string[];
}

export interface ClassifyResult {
  category: string | null;
  tags: string[];
  confidence: number;
}

export function classifyByNeighbors(
  neighbors: Neighbor[],
  k: number = 5
): ClassifyResult {
  const top = neighbors
    .filter((n) => n.category && n.category !== "Sin categorizar")
    .slice(0, k);

  if (top.length === 0) {
    return { category: null, tags: [], confidence: 0 };
  }

  const votes: Record<string, { score: number; count: number }> = {};
  const tagVotes: Record<string, number> = {};

  for (const n of top) {
    if (!votes[n.category]) votes[n.category] = { score: 0, count: 0 };
    votes[n.category].score += n.similarity;
    votes[n.category].count += 1;

    for (const tag of n.tags) {
      tagVotes[tag] = (tagVotes[tag] || 0) + n.similarity;
    }
  }

  let bestCategory: string | null = null;
  let bestScore = -1;

  for (const [cat, { score, count }] of Object.entries(votes)) {
    const avgScore = score / count;
    if (avgScore > bestScore) {
      bestScore = avgScore;
      bestCategory = cat;
    }
  }

  const sortedTags = Object.entries(tagVotes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  const confidence = bestScore;

  return {
    category: bestCategory,
    tags: sortedTags,
    confidence,
  };
}

export function buildBookmarkText(
  title: string,
  description: string | undefined,
  url: string
): string {
  const parts = [title];
  if (description && description.trim()) parts.push(description.trim());
  try {
    const u = new URL(url);
    parts.push(u.hostname.replace(/^www\./, ""));
  } catch {
    // url inválida, ignorar
  }
  return parts.join(" ").slice(0, 1000);
}