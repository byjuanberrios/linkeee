"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Calendar,
  Edit,
  Trash2,
  MoreVertical,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Bookmark } from "@/types/bookmark";
import BookmarkForm from "./bookmark-form";
import { toast } from "@/hooks/use-toast";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showSharedOnly, setShowSharedOnly] = useState(false);
  const [deletingBookmarkId, setDeletingBookmarkId] = useState<string | null>(
    null
  );
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [deletingMultiple, setDeletingMultiple] = useState(false);

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

  // Función para filtrar bookmarks por término de búsqueda y filtro de compartidos
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    // Filtro por compartidos
    if (showSharedOnly && !bookmark.is_shared) {
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar bookmarks..."
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
          {selectedBookmarks.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteMultiple}
              disabled={deletingMultiple}
              className="flex-1 sm:flex-none"
            >
              {deletingMultiple
                ? "Eliminando..."
                : `Eliminar (${selectedBookmarks.length})`}
            </Button>
          )}
          <BookmarkForm onBookmarkAdded={onBookmarkAdded} />
        </div>
      </header>

      {(selectedTag || showSharedOnly) && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Filtrando por:
            </span>
            {selectedTag && (
              <Badge variant="default" className="flex items-center gap-2">
                {selectedTag}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={clearTagFilter}
                />
              </Badge>
            )}
            {showSharedOnly && (
              <Badge variant="secondary" className="flex items-center gap-2">
                <Share2 className="w-3 h-3" />
                Compartidos
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setShowSharedOnly(false)}
                />
              </Badge>
            )}
          </div>
        </div>
      )}

      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm
            ? `No se encontraron bookmarks que coincidan con "${searchTerm}"`
            : selectedTag
            ? `No hay bookmarks con el tag "${selectedTag}"`
            : showSharedOnly
            ? "No tienes bookmarks compartidos aún."
            : "No tienes bookmarks aún. ¡Agrega tu primero!"}
        </div>
      ) : (
        <>
          {/* Vista de tabla para desktop */}
          <div className="hidden md:block border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      checked={
                        selectedBookmarks.length === filteredBookmarks.length &&
                        filteredBookmarks.length > 0
                      }
                      onChange={handleSelectAll}
                      aria-label="Seleccionar todos"
                    />
                  </TableHead>
                  <TableHead className="w-[300px]">Título</TableHead>
                  <TableHead className="w-[150px]">Tags</TableHead>
                  <TableHead className="w-[120px]">Fecha</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookmarks.map((bookmark) => (
                  <TableRow key={bookmark.id} className="hover:bg-muted/50">
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedBookmarks.includes(bookmark.id)}
                        onChange={() => handleSelectBookmark(bookmark.id)}
                        aria-label={`Seleccionar bookmark ${bookmark.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:text-stone-600 flex items-center gap-1"
                        >
                          <span className="whitespace-nowrap overflow-hidden max-w-sm">
                            {bookmark.title}
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {bookmark.is_shared && (
                          <Share2 className="w-3 h-3 text-green-600" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-[280px]">
                        {bookmark.url}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-[300px]">
                        {bookmark.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {bookmark.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => handleTagClick(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {bookmark.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{bookmark.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(bookmark.created_at).toLocaleDateString(
                          "es-ES"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
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
                            onBookmarkUpdated={() =>
                              fetchBookmarks(selectedTag || undefined)
                            }
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
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
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  ¿Eliminar bookmark?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que quieres eliminar &quot;
                                  {bookmark.title}&quot;? Esta acción no se puede
                                  deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteBookmark(bookmark.id)
                                  }
                                  disabled={deletingBookmarkId === bookmark.id}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deletingBookmarkId === bookmark.id
                                    ? "Eliminando..."
                                    : "Eliminar"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Vista de tarjetas para móvil */}
          <div className="md:hidden space-y-4">
            {filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedBookmarks.includes(bookmark.id)}
                      onChange={() => handleSelectBookmark(bookmark.id)}
                      aria-label={`Seleccionar bookmark ${bookmark.title}`}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-stone-600 flex items-center gap-1 text-sm"
                      >
                        <span className="truncate">{bookmark.title}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                      {bookmark.is_shared && (
                        <Share2 className="w-3 h-3 text-green-600 mt-1" />
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <MoreVertical className="h-4 w-4" />
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
                        onBookmarkUpdated={() =>
                          fetchBookmarks(selectedTag || undefined)
                        }
                        trigger={
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                          >
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
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Eliminar bookmark?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              ¿Estás seguro de que quieres eliminar &quot;
                              {bookmark.title}&quot;? Esta acción no se puede
                              deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBookmark(bookmark.id)}
                              disabled={deletingBookmarkId === bookmark.id}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingBookmarkId === bookmark.id
                                ? "Eliminando..."
                                : "Eliminar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="text-xs text-muted-foreground truncate">
                  {bookmark.url}
                </div>

                {bookmark.description && (
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {bookmark.description}
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {bookmark.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {bookmark.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{bookmark.tags.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {new Date(bookmark.created_at).toLocaleDateString("es-ES")}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
