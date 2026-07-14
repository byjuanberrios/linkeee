"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  X,
  ExternalLink,
  Share2,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Bookmark } from "@/types/bookmark";
import BookmarkForm from "./bookmark-form";
import { toast } from "@/hooks/use-toast";
import BookmarkControls from "./bookmark-controls";

interface BookmarkListProps {
  onBookmarkAdded?: () => void;
  refreshTrigger: number;
  setRefreshTrigger: Dispatch<SetStateAction<number>>;
}

export default function BookmarkList({
  onBookmarkAdded,
  refreshTrigger,
  setRefreshTrigger,
}: BookmarkListProps) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSharedOnly, setShowSharedOnly] = useState(false);
  const [deletingBookmarkId, setDeletingBookmarkId] = useState<string | null>(
    null
  );
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [deletingMultiple, setDeletingMultiple] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | undefined>(undefined);

  // Recuperar URL pendiente del flujo "pegar sin sesión"
  useEffect(() => {
    const stored = sessionStorage.getItem("pending_bookmark_url");
    if (stored) {
      setPendingUrl(stored);
      sessionStorage.removeItem("pending_bookmark_url");
    }
  }, []);

  const fetchBookmarks = async (tag?: string) => {
    if (!user) return;

    try {
      const url = tag
        ? `/api/bookmarks/user?tag=${encodeURIComponent(tag)}`
        : "/api/bookmarks/user";

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setBookmarks(data.bookmarks || []);
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!user) return;

    setDeletingBookmarkId(bookmarkId);

    try {
      const response = await fetch(`/api/bookmarks/user/${bookmarkId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el bookmark");
      }

      toast({
        title: "Bookmark eliminado",
        description: "El bookmark se ha eliminado exitosamente.",
      });

      // Actualizar la lista localmente
      setBookmarks((prev) =>
        prev.filter((bookmark) => bookmark.id !== bookmarkId)
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el bookmark.",
        variant: "destructive",
      });
    } finally {
      setDeletingBookmarkId(null);
    }
  };

  const handleSelectBookmark = (bookmarkId: string) => {
    setSelectedBookmarks((prev) =>
      prev.includes(bookmarkId)
        ? prev.filter((id) => id !== bookmarkId)
        : [...prev, bookmarkId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBookmarks.length === filteredBookmarks.length) {
      setSelectedBookmarks([]);
    } else {
      setSelectedBookmarks(filteredBookmarks.map((b) => b.id));
    }
  };

  const handleDeleteMultiple = async () => {
    if (!user || selectedBookmarks.length === 0) return;
    setDeletingMultiple(true);
    try {
      const results = await Promise.all(
        selectedBookmarks.map((bookmarkId) =>
          fetch(`/api/bookmarks/user/${bookmarkId}`, {
            method: "DELETE",
          })
        )
      );
      if (results.some((res) => !res.ok)) {
        throw new Error("Error al eliminar uno o más bookmarks");
      }
      toast({
        title: "Bookmarks eliminados",
        description:
          "Los bookmarks seleccionados se han eliminado exitosamente.",
      });
      setBookmarks((prev) =>
        prev.filter((b) => !selectedBookmarks.includes(b.id))
      );
      setSelectedBookmarks([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar los bookmarks seleccionados.",
        variant: "destructive",
      });
    } finally {
      setDeletingMultiple(false);
    }
  };

  useEffect(() => {
    fetchBookmarks(selectedTag || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, selectedTag, user]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? null : tag);
  };

  const clearTagFilter = () => {
    setSelectedTag(null);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  const clearCategoryFilter = () => {
    setSelectedCategory(null);
  };

  // Función para filtrar bookmarks por término de búsqueda y filtro de compartidos
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    // Filtro por compartidos
    if (showSharedOnly && !bookmark.is_shared) {
      return false;
    }

    // Filtro por categoría
    if (selectedCategory && bookmark.category !== selectedCategory) {
      return false;
    }

    // Filtro por término de búsqueda
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      bookmark.title.toLowerCase().includes(searchLower) ||
      bookmark.description?.toLowerCase().includes(searchLower) ||
      bookmark.url.toLowerCase().includes(searchLower) ||
      bookmark.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return <div className="text-center py-8">Cargando bookmarks...</div>;
  }

  const countLabel = `${filteredBookmarks.length} ${
    filteredBookmarks.length === 1 ? "enlace" : "enlaces"
  }${selectedTag ? ` · tag: ${selectedTag}` : ""}${
    selectedCategory ? ` · ${selectedCategory}` : ""
  }${showSharedOnly ? " · compartidos" : ""}`;

  const renderRowActions = (bookmark: Bookmark) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        >
          <MoreVertical className="h-3.5 w-3.5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Abrir enlace
          </a>
        </DropdownMenuItem>
        <BookmarkForm
          bookmark={bookmark}
          onBookmarkUpdated={() => fetchBookmarks(selectedTag || undefined)}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </DropdownMenuItem>
          }
        />
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar enlace?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Quitar &quot;{bookmark.title}&quot; de tu archivo? No se puede
                deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteBookmark(bookmark.id)}
                disabled={deletingBookmarkId === bookmark.id}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {deletingBookmarkId === bookmark.id
                  ? "Eliminando…"
                  : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-4">
      <BookmarkControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showSharedOnly={showSharedOnly}
        setShowSharedOnly={setShowSharedOnly}
        onBookmarkAdded={onBookmarkAdded}
        selectedBookmarksCount={selectedBookmarks.length}
        onDeleteMultiple={handleDeleteMultiple}
        deletingMultiple={deletingMultiple}
        initialUrl={pendingUrl}
        defaultOpen={!!pendingUrl}
      />

      {(selectedTag || selectedCategory || showSharedOnly) && (
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <span className="text-muted-foreground">filtro:</span>
          {selectedTag && (
            <button
              onClick={clearTagFilter}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              #{selectedTag}
              <X className="w-3 h-3" />
            </button>
          )}
          {selectedCategory && (
            <button
              onClick={clearCategoryFilter}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary text-secondary-foreground capitalize hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {selectedCategory}
              <X className="w-3 h-3" />
            </button>
          )}
          {showSharedOnly && (
            <button
              onClick={() => setShowSharedOnly(false)}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Share2 className="w-3 h-3" />
              compartidos
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {filteredBookmarks.length === 0 ? (
        <div className="border border-dashed border-border py-16 px-6 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            {searchTerm
              ? `sin resultados para "${searchTerm}"`
              : selectedTag
              ? `nada con el tag #${selectedTag}`
              : showSharedOnly
              ? "no tienes enlaces compartidos todavía"
              : "tu archivo está vacío — pega tu primer enlace arriba"}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>{countLabel}</span>
            <span className="hidden sm:inline">orden: recientes</span>
          </div>

          {/* Vista de tabla para desktop */}
          <div className="hidden md:block border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-10 h-9 px-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedBookmarks.length === filteredBookmarks.length &&
                        filteredBookmarks.length > 0
                      }
                      onChange={handleSelectAll}
                      aria-label="Seleccionar todos"
                      className="accent-accent"
                    />
                  </TableHead>
                  <TableHead className="h-9 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Enlace
                  </TableHead>
                  <TableHead className="h-9 w-[160px] font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Tags
                  </TableHead>
                  <TableHead className="h-9 w-[120px] font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Categoría
                  </TableHead>
                  <TableHead className="h-9 w-[90px] font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Fecha
                  </TableHead>
                  <TableHead className="h-9 w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookmarks.map((bookmark) => (
                  <TableRow
                    key={bookmark.id}
                    className="border-border group hover:bg-secondary/40"
                  >
                    <TableCell className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedBookmarks.includes(bookmark.id)}
                        onChange={() => handleSelectBookmark(bookmark.id)}
                        aria-label={`Seleccionar ${bookmark.title}`}
                        className="accent-accent"
                      />
                    </TableCell>
                    <TableCell className="py-2 pr-4 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground hover:text-accent transition-colors truncate"
                          title={bookmark.title}
                        >
                          {bookmark.title}
                        </a>
                        {bookmark.is_shared && (
                          <Share2 className="w-3 h-3 text-accent flex-shrink-0" />
                        )}
                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground mt-0.5 truncate max-w-[420px]">
                        {bookmark.url.replace(/^https?:\/\//, "")}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {bookmark.tags.slice(0, 3).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            className="font-mono text-[11px] px-1.5 py-0.5 border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                        {bookmark.tags.length > 3 && (
                          <span className="font-mono text-[11px] px-1.5 py-0.5 text-muted-foreground">
                            +{bookmark.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 pr-4">
                      <button
                        onClick={() => handleCategoryClick(bookmark.category)}
                        className="font-mono text-[11px] px-1.5 py-0.5 bg-secondary text-secondary-foreground capitalize hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {bookmark.category}
                      </button>
                    </TableCell>
                    <TableCell className="py-2 pr-4">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {new Date(bookmark.created_at).toLocaleDateString(
                          "es-ES",
                          { year: "2-digit", month: "2-digit", day: "2-digit" }
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 pr-2">
                      {renderRowActions(bookmark)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vista de tarjetas para móvil */}
          <div className="md:hidden divide-y divide-border border border-border">
            {filteredBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="p-3 group">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedBookmarks.includes(bookmark.id)}
                    onChange={() => handleSelectBookmark(bookmark.id)}
                    aria-label={`Seleccionar ${bookmark.title}`}
                    className="mt-1 accent-accent"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm text-foreground hover:text-accent transition-colors flex items-center gap-1 min-w-0"
                      >
                        <span className="truncate">{bookmark.title}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                      {renderRowActions(bookmark)}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground mt-1 truncate">
                      {bookmark.url.replace(/^https?:\/\//, "")}
                    </div>
                    {bookmark.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {bookmark.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                      <div className="flex flex-wrap gap-1">
                        {bookmark.tags.slice(0, 3).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => handleTagClick(tag)}
                            className="font-mono text-[11px] px-1.5 py-0.5 border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                        {bookmark.tags.length > 3 && (
                          <span className="font-mono text-[11px] px-1.5 py-0.5 text-muted-foreground">
                            +{bookmark.tags.length - 3}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {bookmark.is_shared && (
                          <Share2 className="w-3 h-3 text-accent" />
                        )}
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {new Date(bookmark.created_at).toLocaleDateString(
                            "es-ES",
                            {
                              year: "2-digit",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
