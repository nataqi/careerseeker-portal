
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, AuthResponse, AuthError } from "@supabase/supabase-js";
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
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          throw error;
        }
        
        console.log("Session check:", session ? "Active session found" : "No active session");
        
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
        }));
      } catch (error) {
        console.error("Session retrieval error:", error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };
    
    checkSession();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    console.log("Attempting signup for:", email);
    
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
    
    console.log("Signup successful:", response.data?.user?.id);
    return response;
  };

  const signIn = async (email: string, password: string) => {
    console.log("Attempting signin for:", email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Signin error:", error);
      throw error;
    }
    
    console.log("Signin successful:", data.user?.id);
    navigate("/search");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Signout error:", error);
      throw error;
    }
    console.log("Signout successful");
    navigate("/");
  };

  const resetPassword = async (email: string) => {
    console.log("Attempting password reset for:", email);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) {
      console.error("Reset password error:", error);
      throw error;
    }
    
    console.log("Password reset email sent successfully");
  };

  const updatePassword = async (newPassword: string) => {
    console.log("Attempting to update password");
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      console.error("Update password error:", error);
      throw error;
    }
    
    console.log("Password updated successfully");
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
