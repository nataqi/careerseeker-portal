
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, AuthResponse } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", !!session);
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, !!session);
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    // Check email format
    if (!email.includes('@')) {
      throw new Error("Please enter a valid email address");
    }
    
    console.log("Starting signup for:", email);
    
    // Define the current URL for proper redirects
    const origin = window.location.origin;
    const redirectUrl = `${origin}/auth/verify`;
    
    console.log("Using redirect URL:", redirectUrl);
    
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
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
    console.log("Starting signin for:", email);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Signin error:", error);
      throw error;
    }
    
    console.log("Signin successful, redirecting to search");
    toast({
      title: "Welcome back!",
      description: "You have successfully signed in"
    });
    navigate("/search");
  };

  const signOut = async () => {
    console.log("Signing out");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Signout error:", error);
      throw error;
    }
    navigate("/");
  };

  const resetPassword = async (email: string) => {
    if (!email.includes('@')) {
      throw new Error("Please enter a valid email address");
    }
    
    console.log("Requesting password reset for:", email);
    
    // Define the current URL for proper redirects
    const origin = window.location.origin;
    const redirectUrl = `${origin}/auth/reset-confirmation`;
    
    console.log("Using reset redirect URL:", redirectUrl);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    if (error) {
      console.error("Reset password error:", error);
      throw error;
    }
    
    console.log("Password reset email sent");
  };

  const updatePassword = async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    
    console.log("Updating password");
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) {
      console.error("Update password error:", error);
      throw error;
    }
    
    console.log("Password updated successfully");
    
    // Optionally refresh the session after password update
    try {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn("Session refresh after password update failed:", refreshError);
      }
    } catch (refreshErr) {
      console.warn("Error refreshing session after password update:", refreshErr);
    }
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
