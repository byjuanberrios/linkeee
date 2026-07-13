"use client";

import type React from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Share2 } from "lucide-react";
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
}: BookmarkControlsProps) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar bookmarks o tags o categorías…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2 whitespace-nowrap">
          <Switch
            id="shared-filter"
            checked={showSharedOnly}
            onCheckedChange={setShowSharedOnly}
          />
          <Label
            htmlFor="shared-filter"
            className="text-sm flex items-center gap-1"
          >
            <Share2 className="w-4 h-4" />
            Solo compartidos
          </Label>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {selectedBookmarksCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteMultiple}
            disabled={deletingMultiple}
            className="flex-1 sm:flex-none"
          >
            {deletingMultiple
              ? "Eliminando..."
              : `Eliminar (${selectedBookmarksCount})`}
          </Button>
        )}
        <BookmarkForm onBookmarkAdded={onBookmarkAdded} />
      </div>
    </header>
  );
}



