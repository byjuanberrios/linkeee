"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import type { Bookmark } from "@/types/bookmark";

interface BookmarkFormProps {
  onBookmarkAdded?: () => void;
  onBookmarkUpdated?: () => void;
  bookmark?: Bookmark; // Para modo edición
  trigger?: React.ReactNode; // Trigger personalizado
}

// Trigger por defecto para modo creación
export const DefaultAddBookmarkButton = (
  <Button size="sm">
    <Plus className="w-4 h-4" />
    <span>Agregar Bookmark</span>
  </Button>
);

export default function BookmarkForm({
  onBookmarkAdded,
  onBookmarkUpdated,
  bookmark,
  trigger,
}: BookmarkFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    url: "",
    title: "",
    description: "",
    tags: [] as string[],
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
        is_shared: bookmark.is_shared || false,
      });
    }
  }, [bookmark]);

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Bookmark" : "Agregar Nuevo Bookmark"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                placeholder="https://domain.com"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={fetchUrlMetadata}
                disabled={fetchingMetadata || !formData.url.trim()}
                title="Obtener título y descripción automáticamente"
              >
                {fetchingMetadata ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Título del bookmark"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción opcional"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Agregar tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_shared"
              checked={formData.is_shared}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_shared: checked as boolean })
              }
            />
            <Label htmlFor="is_shared">Compartir públicamente</Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? isEditMode
                ? "Guardando..."
                : "Guardando..."
              : isEditMode
              ? "Actualizar Bookmark"
              : "Guardar Bookmark"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
