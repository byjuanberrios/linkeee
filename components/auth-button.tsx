"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Github, LogOut, AlertCircle, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

const HAS_GITHUB = !!process.env.NEXT_PUBLIC_GITHUB_ID;

export default function AuthButton() {
  const { user, loading, signInWithGitHub, signOut, isAuthorized } = useAuth();
  const router = useRouter();

  if (loading) {
    return <Button disabled>Cargando...</Button>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={() => router.push("/login")}>
          <LogIn className="w-4 h-4 mr-2" />
          Iniciar sesión
        </Button>
        {HAS_GITHUB && (
          <Button variant="outline" onClick={signInWithGitHub}>
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </Button>
        )}
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <AlertCircle className="w-4 h-4" />
        Acceso denegado - Usuario no autorizado
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.user_metadata?.avatar_url || ""}
              alt={user.user_metadata?.full_name || ""}
            />
            <AvatarFallback>
              {user.user_metadata?.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.full_name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}