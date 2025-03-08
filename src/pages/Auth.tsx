
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [isNewPasswordSet, setIsNewPasswordSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const { signIn, signUp, resetPassword, updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in password reset mode
  const isResetPassword = location.pathname === "/auth/reset-password";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isResetPassword) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
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
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        
        const response = await signUp(email, password);
        console.log("Signup response:", response);
        
        if (response.data.user && response.data.session === null) {
          // User needs to confirm email
          setSignupComplete(true);
          toast({
            title: "Email Verification Required",
            description: "Please check your email to verify your account before signing in",
          });
        } else {
          // Auto sign-in (if email confirmation is disabled)
          navigate("/search");
        }
      } else {
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

        {signupComplete ? (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                We've sent a verification email to <strong>{email}</strong>. 
                Please check your inbox and follow the link to verify your account.
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-500 text-center">
              After verifying your email, you can sign in to your account.
            </p>
            <Button
              variant="default"
              className="w-full mt-4"
              onClick={() => {
                setIsSignUp(false);
                setSignupComplete(false);
              }}
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isResetPassword && (
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                />
              </div>
            )}

            {(isSignUp || isResetPassword) && (
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
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
        )}

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
        ) : !signupComplete && (
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
