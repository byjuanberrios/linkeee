"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Share2 } from "lucide-react"
import type { Bookmark } from "@/types/bookmark"

interface BookmarkCardProps {
  bookmark: Bookmark
  onTagClick: (tag: string) => void
}

export default function BookmarkCard({ bookmark, onTagClick }: BookmarkCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 flex items-center gap-2"
            >
              {bookmark.title}
              <ExternalLink className="w-4 h-4" />
            </a>
          </CardTitle>
          {bookmark.is_shared && <Share2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
        </div>
        {bookmark.description && <CardDescription className="line-clamp-3">{bookmark.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {bookmark.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => onTagClick(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {new Date(bookmark.created_at).toLocaleDateString("es-ES")}
        </p>
      </CardContent>
    </Card>
  )
}
