import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { ObjectId } from "mongodb";

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
    const { url, title, description, tags, is_shared } = body;

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
      is_shared: !!is_shared,
      created_at: now,
      updated_at: now,
    };

    const result = await collection.insertOne(doc);
    const bookmark = { ...doc, id: result.insertedId.toString() };

    return NextResponse.json({ bookmark });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
