
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [isNewPasswordSet, setIsNewPasswordSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, resetPassword, updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Check if we're in password reset mode
  const isResetPassword = location.pathname === "/auth/reset-password";

  // Check for password recovery token in the URL
  useEffect(() => {
    const checkRecoveryToken = async () => {
      if (isResetPassword) {
        // Try to get the session, which might have the recovery token
        const { data, error } = await supabase.auth.getSession();
        
        // Log information for debugging
        console.log("Current URL:", window.location.href);
        console.log("Session data:", data);
        console.log("Session error:", error);
        
        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Password reset token is invalid or has expired. Please try again."
          });
          navigate("/auth");
        }
      }
    };
    
    checkRecoveryToken();
  }, [isResetPassword, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isResetPassword) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        
        console.log("Attempting to update password");
        await updatePassword(password);
        
        toast({
          title: "Success",
          description: "Your password has been updated successfully",
        });
        setIsNewPasswordSet(true);
      } else if (isReset) {
        console.log("Attempting to send reset password email to:", email);
        await resetPassword(email);
        
        toast({
          title: "Success",
          description: "Password reset instructions have been sent to your email",
        });
        setIsReset(false);
      } else if (isSignUp) {
        console.log("Attempting to sign up with email:", email);
        const response = await signUp(email, password);
        console.log("Signup response:", response);
        
        toast({
          title: "Success",
          description: "Please check your email to verify your account",
        });
      } else {
        console.log("Attempting to sign in with email:", email);
        await signIn(email, password);
        navigate("/search");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
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
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white shadow-sm border-[#FFF9C4]/50">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isResetPassword && (
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[#FFF9C4]"
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
                required
                className="border-[#FFF9C4]"
              />
            </div>
          )}

          {isResetPassword && (
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-[#FFF9C4]"
              />
            </div>
          )}

          <Button type="submit" className="w-full bg-[#F8BBD0] hover:bg-[#F8BBD0]/90 text-gray-800" disabled={isLoading || isNewPasswordSet}>
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
              className="w-full bg-[#F8BBD0] hover:bg-[#F8BBD0]/90 text-gray-800"
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
                onClick={() => setIsReset(true)}
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
