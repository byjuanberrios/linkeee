"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Github } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

const HAS_GITHUB = !!(process.env.NEXT_PUBLIC_GITHUB_ID && process.env.NEXT_PUBLIC_GITHUB_ID.trim() !== "");
const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;

export default function LoginPage() {
  const { signInWithCredentials, signInWithGitHub } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState(ALLOWED_EMAIL ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await signInWithCredentials(email, password);
    setSubmitting(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Email o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="font-semibold tracking-tight">linkeee</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">iniciar sesión</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent mb-6">
            acceso a tu archivo
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                autoFocus
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="font-mono text-sm"
              />
            </div>
            {error && (
              <p className="font-mono text-[11px] text-destructive border-l-2 border-destructive pl-2">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-mono text-xs font-medium"
              disabled={submitting}
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              {submitting ? "ingresando…" : "iniciar sesión"}
            </Button>
          </form>

          {HAS_GITHUB && (
            <>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    o
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full h-10 font-mono text-xs"
                onClick={signInWithGitHub}
              >
                <Github className="w-3.5 h-3.5 mr-1.5" />
                continuar con github
              </Button>
            </>
          )}

          <p className="mt-6 font-mono text-[10px] text-muted-foreground text-center">
            acceso restringido a usuarios autorizados
          </p>
        </div>
      </main>
    </div>
  );
}