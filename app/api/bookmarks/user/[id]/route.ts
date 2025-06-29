import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

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
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que el usuario esté autorizado
    if (!isUserAuthorized(user.email)) {
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

    // Verificar que el bookmark pertenece al usuario
    const { data: existingBookmark, error: fetchError } = await supabase
      .from("bookmarks")
      .select("id, user_id")
      .eq("id", params.id)
      .single();

    if (fetchError || !existingBookmark) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }

    if (existingBookmark.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data: bookmark, error } = await supabase
      .from("bookmarks")
      .update({
        url,
        title,
        description: description || "",
        tags: tags || [],
        is_shared: is_shared || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que el usuario esté autorizado
    if (!isUserAuthorized(user.email)) {
      return NextResponse.json(
        { error: "Access denied - Unauthorized user" },
        { status: 403 }
      );
    }

    // Verificar que el bookmark pertenece al usuario
    const { data: existingBookmark, error: fetchError } = await supabase
      .from("bookmarks")
      .select("id, user_id")
      .eq("id", params.id)
      .single();

    if (fetchError || !existingBookmark) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }

    if (existingBookmark.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Bookmark deleted successfully" });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
