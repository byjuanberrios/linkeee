"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, LogIn, Github } from "lucide-react";

const HAS_GITHUB = !!process.env.NEXT_PUBLIC_GITHUB_ID;
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
      setError("Credenciales inválidas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Bookmark className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl">Linkeee</CardTitle>
          <CardDescription>Inicia sesión para acceder a tus bookmarks</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              <LogIn className="w-4 h-4 mr-2" />
              {submitting ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>
          {HAS_GITHUB && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">o</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={signInWithGitHub}>
                <Github className="w-4 h-4 mr-2" />
                Continuar con GitHub
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground text-center justify-center">
          Acceso restringido a usuarios autorizados
        </CardFooter>
      </Card>
    </div>
  );
}