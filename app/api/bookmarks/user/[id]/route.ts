import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const db = await getDb();
    const collection = db.collection("bookmarks");

    const _id = new ObjectId(params.id);
    const existing = await collection.findOne({ _id });
    if (!existing) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }
    if (existing.user_id !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateDoc = {
      url,
      title,
      description: description || "",
      tags: Array.isArray(tags) ? tags : [],
      is_shared: !!is_shared,
      updated_at: new Date().toISOString(),
    };

    await collection.updateOne({ _id }, { $set: updateDoc });
    const updated = await collection.findOne({ _id });
    const bookmark = {
      id: updated!._id.toString(),
      user_id: updated!.user_id,
      url: updated!.url,
      title: updated!.title,
      description: updated!.description,
      tags: updated!.tags ?? [],
      is_shared: !!updated!.is_shared,
      created_at: updated!.created_at,
      updated_at: updated!.updated_at,
    };

    return NextResponse.json({ bookmark });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const db = await getDb();
    const collection = db.collection("bookmarks");
    const _id = new ObjectId(params.id);
    const existing = await collection.findOne({ _id });
    if (!existing) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }
    if (existing.user_id !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await collection.deleteOne({ _id });
    return NextResponse.json({ message: "Bookmark deleted successfully" });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
