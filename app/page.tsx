"use client";

import { useState } from "react";
import BookmarkList from "@/components/bookmark-list";
import AuthButton from "@/components/auth-button";
import { useAuth } from "@/lib/auth-context";
import { Bookmark } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleBookmarkAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Bookmark className="w-8 h-8 mx-auto mb-4 animate-pulse" />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Linkeee</h1>
          </div>
          <AuthButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {user ? (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tus Bookmarks</h2>
            </div>
            <BookmarkList
              onBookmarkAdded={handleBookmarkAdded}
              refreshTrigger={refreshTrigger}
              setRefreshTrigger={setRefreshTrigger}
            />
          </div>
        ) : (
          <div className="text-center py-16">
            <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Bienvenido a Linkeee</h2>
            <p className="text-muted-foreground mb-8">
              Inicia sesión con GitHub para comenzar a guardar tus enlaces
              favoritos.
            </p>
            <AuthButton />
          </div>
        )}
      </main>
    </div>
  );
}
