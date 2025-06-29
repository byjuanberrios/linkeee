import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get("tag")

  const supabase = createServerClient()

  let query = supabase.from("bookmarks").select("*").eq("is_shared", true).order("created_at", { ascending: false })

  if (tag) {
    query = query.contains("tags", [tag])
  }

  const { data: bookmarks, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bookmarks })
}
