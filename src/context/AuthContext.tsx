import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  signInWithGitHub: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({data: {session}}) => {
        setUser(session?.user ?? null)
    })

    const {data: listener} = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null)
    })

    return () => {
        listener.subscription.unsubscribe()
    }
  }, [])

  function signInWithGitHub() {
    supabase.auth.signInWithOAuth({ provider: "github" });
  }

  function signOut() {
    supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, signInWithGitHub, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
