import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Failed to fetch session:", error.message);
        return;
      }
      setUser(session?.user ?? null);
    });

    const {data: listener} = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user ?? null)
    })

    return () => {
        listener.subscription.unsubscribe()
    }
  }, [])

  async function signInWithGitHub() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "github" });
    if (error) console.error("GitHub sign-in failed:", error.message);
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Sign-out failed:", error.message);
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
