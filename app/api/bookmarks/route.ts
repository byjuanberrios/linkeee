import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import type { ObjectId } from "mongodb"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get("tag")

  const db = await getDb()

  interface BookmarkDoc {
    _id?: ObjectId
    user_id: string
    url: string
    title: string
    description?: string
    tags?: string[]
    is_shared?: boolean
    created_at?: string
    updated_at?: string
  }

  const collection = db.collection<BookmarkDoc>("bookmarks")

  const filter: Record<string, unknown> = { is_shared: true }
  if (tag) {
    filter.tags = tag
  }

  const docs = await collection
    .find(filter)
    .sort({ created_at: -1 })
    .toArray()

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
  }))

  return NextResponse.json({ bookmarks })
}
