import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const limit = searchParams.get("limit");

    const supabase = createServerClient();

    let query = supabase
      .from("bookmarks")
      .select("id, url, title, description, tags, user_name, created_at")
      .eq("is_shared", true)
      .order("created_at", { ascending: false });

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    if (limit) {
      const limitNum = Number.parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data: bookmarks, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      bookmarks: bookmarks || [],
      total: bookmarks?.length || 0,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
