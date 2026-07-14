"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Github, LogOut, AlertCircle, LogIn, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import ChangePasswordDialog from "./change-password-dialog";
import { useState } from "react";

const HAS_GITHUB = !!(process.env.NEXT_PUBLIC_GITHUB_ID && process.env.NEXT_PUBLIC_GITHUB_ID.trim() !== "");

export default function AuthButton() {
  const { user, loading, signInWithGitHub, signOut, isAuthorized } = useAuth();
  const router = useRouter();
  const [pwOpen, setPwOpen] = useState(false);

  if (loading) {
    return <span className="font-mono text-xs text-muted-foreground">…</span>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/login")}
          className="h-8 px-2.5 font-mono text-xs hover:text-accent"
        >
          <LogIn className="w-3.5 h-3.5 mr-1.5" />
          iniciar sesión
        </Button>
        {HAS_GITHUB && (
          <Button
            variant="ghost"
            size="sm"
            onClick={signInWithGitHub}
            className="h-8 px-2.5 font-mono text-xs"
          >
            <Github className="w-3.5 h-3.5 mr-1.5" />
            github
          </Button>
        )}
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive font-mono">
        <AlertCircle className="w-3.5 h-3.5" />
        acceso denegado
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative h-8 w-8 rounded-full overflow-hidden border border-border hover:border-accent transition-colors">
            <Avatar className="h-full w-full">
              <AvatarImage
                src={user.user_metadata?.avatar_url || ""}
                alt={user.user_metadata?.full_name || ""}
              />
              <AvatarFallback className="font-mono text-xs bg-secondary">
                {user.user_metadata?.full_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuItem className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.user_metadata?.full_name}
              </p>
              <p className="font-mono text-[11px] leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.provider !== "github" && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setPwOpen(true);
              }}
              className="font-mono text-xs"
            >
              <KeyRound className="mr-2 h-3.5 w-3.5" />
              <span>cambiar contraseña</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={signOut} className="font-mono text-xs">
            <LogOut className="mr-2 h-3.5 w-3.5" />
            <span>cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </>
  );
}