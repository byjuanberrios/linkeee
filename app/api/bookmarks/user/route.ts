import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ObjectId } from "mongodb";
import { embed } from "@/lib/embeddings/model";
import {
  cosineSimilarity,
  classifyByNeighbors,
  buildBookmarkText,
  type Neighbor,
} from "@/lib/embeddings/similarity";

// Obtener el email autorizado desde las variables de entorno
const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL;

// Función para verificar si el usuario está autorizado
function isUserAuthorized(userEmail: string | undefined): boolean {
  // Si no hay ALLOWED_EMAIL configurado, permitir acceso a todos los usuarios
  if (!ALLOWED_EMAIL || ALLOWED_EMAIL.trim() === "") {
    return true;
  }
  return userEmail === ALLOWED_EMAIL;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que el usuario esté autorizado
    if (!isUserAuthorized(session.user.email)) {
      return NextResponse.json(
        { error: "Access denied - Unauthorized user" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    const db = await getDb();
    interface BookmarkDoc {
      _id?: ObjectId;
      user_id: string;
      url: string;
      title: string;
      description?: string;
      tags?: string[];
      category: string;
      is_shared?: boolean;
      created_at?: string;
      updated_at?: string;
    }
    const collection = db.collection<BookmarkDoc>("bookmarks");

    const filter: Record<string, unknown> = { user_id: session.user.email };
    if (tag) filter.tags = tag;

    const docs = await collection
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();

    const bookmarks = docs.map((doc) => ({
      id: (doc._id as ObjectId).toString(),
      user_id: doc.user_id,
      url: doc.url,
      title: doc.title,
      description: doc.description,
      tags: doc.tags ?? [],
      category: doc.category || "uncategorized",
      is_shared: !!doc.is_shared,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    }));

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que el usuario esté autorizado
    if (!isUserAuthorized(session.user.email)) {
      return NextResponse.json(
        { error: "Access denied - Unauthorized user" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { url, title, description, tags, category, is_shared } = body;

    if (!url || !title) {
      return NextResponse.json(
        { error: "URL and title are required" },
        { status: 400 }
      );
    }
    const now = new Date().toISOString();
    const db = await getDb();
    interface InsertDoc {
      _id?: ObjectId;
      user_id: string;
      user_email: string;
      user_name: string;
      url: string;
      title: string;
      description?: string;
      tags?: string[];
      category: string;
      is_shared?: boolean;
      created_at: string;
      updated_at: string;
    }
    const collection = db.collection<InsertDoc>("bookmarks");

    const doc = {
      user_id: session.user.email,
      user_email: session.user.email,
      user_name: session.user.name || "Unknown",
      url,
      title,
      description: description || "",
      tags: Array.isArray(tags) ? tags : [],
      category: category || "Sin categorizar",
      is_shared: !!is_shared,
      created_at: now,
      updated_at: now,
    };

    const result = await collection.insertOne(doc);
    const bookmarkId = result.insertedId.toString();
    const bookmark = { ...doc, id: bookmarkId };

    // Auto-classify por embeddings si el bookmark no tiene categoría real
    const needsClassification =
      !category || category === "Sin categorizar" || category === "uncategorized";

    if (needsClassification) {
      try {
        const text = buildBookmarkText(title, description, url);
        const vector = await embed(text);

        const neighbors = await collection
          .find({
            user_id: session.user.email,
            _id: { $ne: result.insertedId },
            embedding: { $exists: true },
            category: { $nin: ["Sin categorizar", "uncategorized", ""] },
          })
          .limit(100)
          .toArray();

        if (neighbors.length >= 3) {
          const scored: Neighbor[] = neighbors.map((n) => ({
            category: n.category,
            similarity: cosineSimilarity(vector, n.embedding!),
            tags: n.tags ?? [],
          }));

          scored.sort((a, b) => b.similarity - a.similarity);

          const result_classify = classifyByNeighbors(scored, 5);

          if (result_classify.category && result_classify.confidence > 0.5) {
            const updateFields: Record<string, unknown> = {
              embedding: vector,
              updated_at: new Date().toISOString(),
            };

            if (result_classify.category) {
              updateFields.category = result_classify.category;
            }

            if (result_classify.tags.length > 0) {
              const existingTags = Array.isArray(tags) ? tags : [];
              const merged = [
                ...existingTags,
                ...result_classify.tags.filter(
                  (t) => !existingTags.includes(t)
                ),
              ];
              updateFields.tags = merged.slice(0, 8);
            }

            await collection.updateOne(
              { _id: result.insertedId },
              { $set: updateFields }
            );

            (bookmark as Record<string, unknown>).category =
              result_classify.category;
            if (result_classify.tags.length > 0) {
              (bookmark as Record<string, unknown>).tags =
                updateFields.tags;
            }
          } else {
            await collection.updateOne(
              { _id: result.insertedId },
              { $set: { embedding: vector } }
            );
          }
        } else {
          await collection.updateOne(
            { _id: result.insertedId },
            { $set: { embedding: vector } }
          );
        }
      } catch (classifyError) {
        console.error("Auto-classify error:", classifyError);
      }
    } else {
      // Tiene categoría definida por el usuario — solo guardamos el embedding
      try {
        const text = buildBookmarkText(title, description, url);
        const vector = await embed(text);
        await collection.updateOne(
          { _id: result.insertedId },
          { $set: { embedding: vector } }
        );
      } catch (embedError) {
        console.error("Embed error:", embedError);
      }
    }

    return NextResponse.json({ bookmark });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
