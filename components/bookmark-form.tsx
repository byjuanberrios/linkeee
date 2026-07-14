"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CategorySelector } from "@/components/ui/category-selector";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, X, Wand2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import type { Bookmark, BookmarkCategory } from "@/types/bookmark";

interface BookmarkFormProps {
  onBookmarkAdded?: () => void;
  onBookmarkUpdated?: () => void;
  bookmark?: Bookmark; // Para modo edición
  trigger?: React.ReactNode; // Trigger personalizado
  initialUrl?: string; // URL pre-cargada (flujo: pegar sin sesión)
  defaultOpen?: boolean; // Abrir dialog automáticamente
}

// Trigger por defecto para modo creación
export const DefaultAddBookmarkButton = (
  <Button
    size="sm"
    className="h-10 px-4 bg-accent text-accent-foreground hover:bg-accent/90 font-mono text-xs font-medium"
  >
    <Plus className="w-3.5 h-3.5" />
    <span>agregar enlace</span>
  </Button>
);

export default function BookmarkForm({
  onBookmarkAdded,
  onBookmarkUpdated,
  bookmark,
  trigger,
  initialUrl,
  defaultOpen,
}: BookmarkFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    url: initialUrl ?? "",
    title: "",
    description: "",
    tags: [] as string[],
    category: "Sin categorizar",
    is_shared: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [fetchingMetadata, setFetchingMetadata] = useState(false);

  const isEditMode = !!bookmark;

  // Cargar datos del bookmark si estamos en modo edición
  useEffect(() => {
    if (bookmark) {
      setFormData({
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description || "",
        tags: bookmark.tags || [],
        category: bookmark.category || "Sin categorizar",
        is_shared: bookmark.is_shared || false,
      });
    }
  }, [bookmark]);

  // Abrir automáticamente si se pide (flujo: URL pendiente tras login)
  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  // Función para obtener metadatos de la URL
  const fetchUrlMetadata = async () => {
    if (!formData.url.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa una URL primero.",
        variant: "destructive",
      });
      return;
    }

    setFetchingMetadata(true);

    try {
      // Necesitamos hacer la petición desde el backend para evitar exponer la API key
      const response = await fetch("/api/bookmarks/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: formData.url }),
      });

      if (!response.ok) {
        throw new Error("No se pudo obtener los metadatos de la URL");
      }

      const data = await response.json();

      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
        }));

        toast({
          title: "Metadatos obtenidos",
          description:
            "El título y descripción se han rellenado automáticamente.",
        });
      } else {
        throw new Error(
          data.error || "No se encontraron metadatos para esta URL"
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "No se pudo obtener los metadatos de la URL. Verifica que la URL sea válida.",
        variant: "destructive",
      });
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const url = isEditMode
        ? `/api/bookmarks/user/${bookmark!.id}`
        : "/api/bookmarks/user";

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(
          isEditMode
            ? "No se pudo actualizar el enlace. Verifica la URL e intenta nuevamente"
            : "No se pudo guardar el enlace. Verifica la URL e intenta nuevamente"
        );
      }

      toast({
        title: isEditMode ? "Bookmark actualizado" : "Bookmark creado",
        description: isEditMode
          ? "El bookmark se ha actualizado exitosamente."
          : "El bookmark se ha agregado exitosamente.",
      });

      // Resetear formulario solo en modo creación
      if (!isEditMode) {
        setFormData({
          url: "",
          title: "",
          description: "",
          tags: [],
          category: "Sin categorizar",
          is_shared: false,
        });
      }

      setOpen(false);

      // Llamar al callback correspondiente
      if (isEditMode && onBookmarkUpdated) {
        onBookmarkUpdated();
      } else if (!isEditMode && onBookmarkAdded) {
        onBookmarkAdded();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: isEditMode
          ? "No se pudo actualizar el bookmark."
          : "No se pudo crear el bookmark.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || DefaultAddBookmarkButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">
            {isEditMode ? "editar enlace" : "agregar enlace"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="url" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                placeholder="https://dominio.com"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                required
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={fetchUrlMetadata}
                disabled={fetchingMetadata || !formData.url.trim()}
                title="Rellenar título y descripción automáticamente"
                className="h-9 w-9 p-0"
              >
                {fetchingMetadata ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Título
            </Label>
            <Input
              id="title"
              placeholder="título del enlace"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Descripción
            </Label>
            <Textarea
              id="description"
              placeholder="descripción opcional"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Categoría
            </Label>
            <CategorySelector
              value={formData.category}
              onChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="agregar tag · enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="font-mono text-sm"
              />
              <Button type="button" onClick={addTag} variant="outline" className="px-3">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formData.tags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="inline-flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 border border-border bg-secondary hover:border-accent hover:text-accent transition-colors"
                  >
                    {tag}
                    <X className="w-2.5 h-2.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="is_shared"
              checked={formData.is_shared}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_shared: checked as boolean })
              }
              className="accent-accent"
            />
            <Label htmlFor="is_shared" className="text-sm">
              Compartir públicamente
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-mono text-xs font-medium"
            disabled={loading}
          >
            {loading
              ? "guardando…"
              : isEditMode
              ? "actualizar enlace"
              : "guardar enlace"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
