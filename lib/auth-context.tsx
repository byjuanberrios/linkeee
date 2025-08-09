"use client";

import type React from "react";
import { createContext, useContext, useMemo } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

type AuthUser = {
  email?: string | null;
  user_metadata?: {
    full_name?: string | null;
    avatar_url?: string | null;
  };
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthorized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;

function isUserAuthorized(userEmail: string | null | undefined): boolean {
  if (!ALLOWED_EMAIL || ALLOWED_EMAIL.trim() === "") return true;
  return userEmail === ALLOWED_EMAIL;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const user: AuthUser | null = useMemo(() => {
    if (!session?.user) return null;
    return {
      email: session.user.email,
      user_metadata: {
        full_name: session.user.name,
        avatar_url: session.user.image,
      },
    };
  }, [session]);

  const authorized = isUserAuthorized(session?.user?.email);

  const value: AuthContextType = {
    user,
    loading: status === "loading",
    signInWithGitHub: async () => {
      await signIn("github", { callbackUrl: "/" });
    },
    signOut: async () => {
      await signOut({ callbackUrl: "/" });
    },
    isAuthorized: !!user && authorized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
