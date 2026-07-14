import { MongoClient } from "mongodb";
import { pipeline, env } from "@huggingface/transformers";
import { buildBookmarkText, cosineSimilarity, classifyByNeighbors, type Neighbor } from "../lib/embeddings/similarity";

env.allowLocalModels = false;

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri || !dbName) {
  console.error("Falta MONGODB_URI o MONGODB_DB en el entorno");
  process.exit(1);
}

async function getExtractor() {
  return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
}

interface BookmarkDoc {
  _id: any;
  url: string;
  title: string;
  description?: string;
  tags?: string[];
  category: string;
  embedding?: number[];
}

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection<BookmarkDoc>("bookmarks");

  const extractor = await getExtractor();

  async function embed(text: string): Promise<number[]> {
    const output = await extractor([text], { pooling: "mean", normalize: true });
    return (output.tolist() as number[][])[0];
  }

  const docs = await collection
    .find({ embedding: { $exists: false } })
    .toArray();

  console.log(`Bookmarks sin embedding: ${docs.length}`);

  if (docs.length === 0) {
    console.log("Nada que hacer.");
    await client.close();
    return;
  }

  let done = 0;
  for (const doc of docs) {
    try {
      const text = buildBookmarkText(doc.title, doc.description, doc.url);
      const vector = await embed(text);
      await collection.updateOne(
        { _id: doc._id },
        { $set: { embedding: vector } }
      );
      done++;
      if (done % 10 === 0) console.log(`Progresado: ${done}/${docs.length}`);
    } catch (err) {
      console.error(`Error en ${doc.url}:`, err);
    }
  }

  console.log(`\nListo. ${done}/${docs.length} bookmarks con embedding.`);

  // Prueba: clasificar un bookmark sin categoría usando sus vecinos
  console.log("\n--- Prueba de clasificación ---");
  const uncategorized = await collection
    .find({
      category: { $in: ["Sin categorizar", "uncategorized", ""] },
      embedding: { $exists: true },
    })
    .limit(3)
    .toArray();

  for (const uc of uncategorized) {
    const neighbors = await collection
      .find({
        _id: { $ne: uc._id },
        embedding: { $exists: true },
        category: { $nin: ["Sin categorizar", "uncategorized", ""] },
      })
      .limit(50)
      .toArray();

    if (neighbors.length >= 3) {
      const scored: Neighbor[] = neighbors.map((n) => ({
        category: n.category,
        similarity: cosineSimilarity(uc.embedding!, n.embedding!),
        tags: n.tags ?? [],
      }));
      scored.sort((a, b) => b.similarity - a.similarity);
      const result = classifyByNeighbors(scored, 5);
      console.log(`  ${uc.title.slice(0, 50)} → ${result.category} (conf: ${result.confidence.toFixed(3)})`);
    } else {
      console.log(`  ${uc.title.slice(0, 50)} → sin vecinos suficientes (${neighbors.length})`);
    }
  }

  await client.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});