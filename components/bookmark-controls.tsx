"use client";

import type React from "react";
import { Input } from "@/components/ui/input";
import { Search, Share2, Trash2 } from "lucide-react";
import BookmarkForm from "./bookmark-form";
import { Button } from "@/components/ui/button";

interface BookmarkControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showSharedOnly: boolean;
  setShowSharedOnly: (checked: boolean) => void;
  onBookmarkAdded: () => void;
  selectedBookmarksCount: number;
  onDeleteMultiple: () => void;
  deletingMultiple: boolean;
  initialUrl?: string;
  defaultOpen?: boolean;
}

export default function BookmarkControls({
  searchTerm,
  setSearchTerm,
  showSharedOnly,
  setShowSharedOnly,
  onBookmarkAdded,
  selectedBookmarksCount,
  onDeleteMultiple,
  deletingMultiple,
  initialUrl,
  defaultOpen,
}: BookmarkControlsProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
        {/* Address bar — search is the browser input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="buscar en tu archivo…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 h-10 font-mono text-sm bg-card border-border focus-visible:border-accent"
            aria-label="Buscar en tus bookmarks"
          />
        </div>

        {/* Browser-style extension toggles */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowSharedOnly(!showSharedOnly)}
            className={[
              "h-10 px-3 inline-flex items-center gap-2 border font-mono text-xs transition-colors",
              showSharedOnly
                ? "border-accent text-accent bg-accent/5"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
            ].join(" ")}
            aria-pressed={showSharedOnly}
            title="Mostrar solo bookmarks compartidos"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">compartidos</span>
          </button>

          {selectedBookmarksCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteMultiple}
              disabled={deletingMultiple}
              className="h-10 px-3 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground font-mono text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deletingMultiple
                ? "eliminando…"
                : `${selectedBookmarksCount}`}
            </Button>
          )}

          {/* Primary action — the only solid button, in accent */}
          <BookmarkForm
            onBookmarkAdded={onBookmarkAdded}
            initialUrl={initialUrl}
            defaultOpen={defaultOpen}
          />
        </div>
      </div>
    </div>
  );
}