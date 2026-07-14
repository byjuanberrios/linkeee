"use client";

import { useState } from "react";
import BookmarkList from "@/components/bookmark-list";
import AuthButton from "@/components/auth-button";
import ThemeToggle from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pendingUrl, setPendingUrl] = useState("");
  const router = useRouter();

  const handleBookmarkAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-mono text-xs text-muted-foreground tracking-wide">
          cargando…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-12 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="font-semibold tracking-tight">linkeee</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">tu archivo de enlaces</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
          <div className="w-full max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent mb-6">
              pegar · guardar · volver a encontrar
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const url = pendingUrl.trim();
                if (url) {
                  sessionStorage.setItem("pending_bookmark_url", url);
                }
                router.push("/login");
              }}
              className="group relative"
            >
              <div className="flex items-stretch border border-border bg-card shadow-[0_1px_0_0_hsl(var(--border))] overflow-hidden focus-within:border-accent transition-colors">
                <span className="hidden sm:flex items-center px-3 font-mono text-xs text-muted-foreground bg-secondary border-r border-border">
                  https://
                </span>
                <input
                  type="text"
                  inputMode="url"
                  value={pendingUrl}
                  onChange={(e) => setPendingUrl(e.target.value)}
                  placeholder="pega un enlace para guardarlo"
                  className="flex-1 bg-transparent px-3 sm:px-4 py-4 font-mono text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                  aria-label="Pega un enlace para guardarlo"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 sm:px-5 font-mono text-sm font-medium text-accent hover:bg-accent hover:text-accent-foreground transition-colors border-l border-border"
                >
                  guardar<span className="hidden sm:inline ml-1">↵</span>
                </button>
              </div>
              <span
                aria-hidden
                className="absolute right-[88px] top-1/2 -translate-y-1/2 w-[2px] h-6 bg-accent animate-caret-blink pointer-events-none group-focus-within:opacity-0"
              />
            </form>

            <p className="mt-4 text-sm text-muted-foreground text-pretty max-w-lg">
              Pega un enlace, inicia sesión, y queda en tu archivo — etiquetado
              y buscable.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-px bg-border border border-border">
              <div className="bg-card p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  pegar
                </p>
                <p className="text-sm mt-1">Cualquier URL, en un campo.</p>
              </div>
              <div className="bg-card p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  etiquetar
                </p>
                <p className="text-sm mt-1">Tags y categorías, tu orden.</p>
              </div>
              <div className="bg-card p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  encontrar
                </p>
                <p className="text-sm mt-1">Búsqueda instantánea en tu archivo.</p>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-10 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
            <span>linkeee · archivo personal de enlaces</span>
            <span className="hidden sm:inline">—</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-sm">
            <button
              onClick={() => router.push("/")}
              className="font-semibold tracking-tight hover:text-accent transition-colors"
            >
              linkeee
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">tu archivo</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8">
        <BookmarkList
          onBookmarkAdded={handleBookmarkAdded}
          refreshTrigger={refreshTrigger}
          setRefreshTrigger={setRefreshTrigger}
        />
      </main>
    </div>
  );
}