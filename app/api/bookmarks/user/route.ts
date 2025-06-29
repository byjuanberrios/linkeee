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

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    let query = supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    const { data: bookmarks, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookmarks: bookmarks || [] });
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

    const { data: bookmark, error } = await supabase
      .from("bookmarks")
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || "Unknown",
        url,
        title,
        description: description || "",
        tags: tags || [],
        is_shared: is_shared || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
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
