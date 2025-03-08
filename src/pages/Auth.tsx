
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [isNewPasswordSet, setIsNewPasswordSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { signIn, signUp, resetPassword, updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in password reset mode
  const isResetPassword = location.pathname === "/auth/reset-password";

  useEffect(() => {
    // Check if we have access token for reset password flow
    if (isResetPassword) {
      const checkSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          // If no session on reset password page, redirect to auth
          navigate("/auth");
          toast({
            title: "Error",
            description: "Password reset session expired or invalid",
            variant: "destructive",
          });
        }
      };
      
      checkSession();
    }
  }, [isResetPassword, navigate, toast]);

  const validateForm = () => {
    setFormError(null);
    
    if (isResetPassword || (!isReset && (isSignUp || !isSignUp))) {
      if (!password || password.length < 6) {
        setFormError("Password must be at least 6 characters");
        return false;
      }
    }
    
    if (isResetPassword || isSignUp) {
      if (password !== confirmPassword) {
        setFormError("Passwords do not match");
        return false;
      }
    }
    
    if (!isResetPassword && !email) {
      setFormError("Email is required");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setFormError(null);

    try {
      if (isResetPassword) {
        await updatePassword(password);
        toast({
          title: "Success",
          description: "Your password has been updated successfully",
        });
        setIsNewPasswordSet(true);
      } else if (isReset) {
        await resetPassword(email);
        toast({
          title: "Success",
          description: "Password reset instructions have been sent to your email",
        });
        setIsReset(false);
      } else if (isSignUp) {
        const response = await signUp(email, password);
        console.log("Signup response:", response);
        
        if (response.data.user && !response.data.session) {
          toast({
            title: "Success",
            description: "Please check your email to verify your account",
          });
        } else {
          // User is auto-confirmed (for development)
          navigate("/search");
        }
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setFormError(error.message || "Authentication failed");
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {isResetPassword
              ? "Set New Password"
              : isReset
              ? "Reset Password"
              : isSignUp
              ? "Create an account"
              : "Welcome back"}
          </h1>
          <p className="text-gray-500">
            {isResetPassword
              ? "Enter your new password"
              : isReset
              ? "Enter your email to receive reset instructions"
              : isSignUp
              ? "Sign up to start your job search journey"
              : "Sign in to continue your job search"}
          </p>
        </div>

        {formError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isResetPassword && (
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!isResetPassword}
              />
            </div>
          )}
          
          {(!isReset || isResetPassword) && (
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isReset}
              />
            </div>
          )}

          {(isResetPassword || isSignUp) && (
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={isResetPassword || isSignUp}
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || isNewPasswordSet}>
            {isLoading
              ? "Loading..."
              : isResetPassword
              ? "Update Password"
              : isReset
              ? "Send Reset Instructions"
              : isSignUp
              ? "Sign Up"
              : "Sign In"}
          </Button>
        </form>

        {isNewPasswordSet ? (
          <div className="text-center space-y-4">
            <p className="text-green-600">Password updated successfully!</p>
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Go to Login
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-2">
            {!isResetPassword && (
              <Button
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setIsReset(false);
                  setFormError(null);
                }}
                className="text-gray-500"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </Button>
            )}
            
            {!isReset && !isSignUp && !isResetPassword && (
              <Button
                variant="link"
                onClick={() => {
                  setIsReset(true);
                  setFormError(null);
                }}
                className="text-gray-500 block mx-auto"
              >
                Forgot password?
              </Button>
            )}
            
            {(isReset || isResetPassword) && (
              <Button
                variant="link"
                onClick={() => {
                  setIsReset(false);
                  navigate("/auth");
                  setFormError(null);
                }}
                className="text-gray-500"
              >
                Back to sign in
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Auth;
