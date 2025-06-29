"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthorized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Obtener el email autorizado desde las variables de entorno
const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;

// Función para verificar si el usuario está autorizado
function isUserAuthorized(userEmail: string | undefined): boolean {
  // Si no hay ALLOWED_EMAIL configurado, permitir acceso a todos los usuarios
  if (!ALLOWED_EMAIL || ALLOWED_EMAIL.trim() === "") {
    return true;
  }
  return userEmail === ALLOWED_EMAIL;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const authorized = isUserAuthorized(session.user.email);
        if (authorized) {
          setUser(session.user);
          setIsAuthorized(true);
        } else {
          // Si el usuario no está autorizado, cerrar sesión automáticamente
          console.log("Usuario no autorizado, cerrando sesión automáticamente");
          supabase.auth.signOut();
          setUser(null);
          setIsAuthorized(false);
        }
      } else {
        setUser(null);
        setIsAuthorized(false);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const authorized = isUserAuthorized(session.user.email);
        if (authorized) {
          setUser(session.user);
          setIsAuthorized(true);
        } else {
          // Si el usuario no está autorizado, cerrar sesión automáticamente
          console.log("Usuario no autorizado, cerrando sesión automáticamente");
          supabase.auth.signOut();
          setUser(null);
          setIsAuthorized(false);
        }
      } else {
        setUser(null);
        setIsAuthorized(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGitHub, signOut, isAuthorized }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
