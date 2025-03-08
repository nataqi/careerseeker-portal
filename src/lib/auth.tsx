
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, AuthResponse } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

interface AuthState {
  user: User | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Auth session on load:", session);
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    console.log("Signing up with email:", email);
    
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/verify`,
        data: {
          full_name: "",
          avatar_url: "",
        }
      }
    });
    
    if (response.error) {
      console.error("Signup error:", response.error);
      throw response.error;
    }
    
    console.log("Signup response:", response);
    return response;
  };

  const signIn = async (email: string, password: string) => {
    console.log("Signing in with email:", email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Signin error:", error);
      throw error;
    }
    
    console.log("Signin successful:", data.user?.email);
    navigate("/search");
  };

  const signOut = async () => {
    console.log("Signing out");
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Signout error:", error);
      throw error;
    }
    
    console.log("Signout successful");
    navigate("/");
  };

  const resetPassword = async (email: string) => {
    console.log("Requesting password reset for:", email);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) {
      console.error("Reset password error:", error);
      throw error;
    }
    
    console.log("Reset password email sent");
  };

  const updatePassword = async (newPassword: string) => {
    console.log("Updating password");
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      console.error("Update password error:", error);
      throw error;
    }
    
    console.log("Password updated successfully");
    navigate("/search");
  };

  return (
    <AuthContext.Provider value={{ 
      ...state, 
      signUp, 
      signIn, 
      signOut, 
      resetPassword, 
      updatePassword 
    }}>
      {!state.loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
