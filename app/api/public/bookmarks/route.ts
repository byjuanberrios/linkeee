import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const limit = searchParams.get("limit");

    const db = await getDb();
    interface BookmarkDoc {
      _id?: ObjectId;
      url: string;
      title: string;
      description?: string;
      tags?: string[];
      user_name?: string;
      created_at?: string;
      is_shared?: boolean;
    }
    const collection = db.collection<BookmarkDoc>("bookmarks");

    const filter: Record<string, unknown> = { is_shared: true };
    if (tag) filter.tags = tag;

    let cursor = collection
      .find(filter, {
        projection: {
          url: 1,
          title: 1,
          description: 1,
          tags: 1,
          user_name: 1,
          created_at: 1,
        },
      })
      .sort({ created_at: -1 });

    if (limit) {
      const limitNum = Number.parseInt(limit);
      if (!Number.isNaN(limitNum) && limitNum > 0) {
        cursor = cursor.limit(limitNum);
      }
    }

    const docs = await cursor.toArray();
    const bookmarks = docs.map((doc) => ({
      id: (doc._id as ObjectId).toString(),
      url: doc.url,
      title: doc.title,
      description: doc.description,
      tags: doc.tags ?? [],
      user_name: doc.user_name ?? null,
      created_at: doc.created_at,
    }));

    return NextResponse.json({ bookmarks, total: bookmarks.length });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
