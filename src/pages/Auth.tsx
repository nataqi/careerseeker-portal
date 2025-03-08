
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [isNewPasswordSet, setIsNewPasswordSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [signupComplete, setSignupComplete] = useState(false);
  const { signIn, signUp, resetPassword, updatePassword, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're in password reset mode
  const isResetPassword = location.pathname === "/auth/reset-password";

  // If user is already logged in, redirect to search page
  useEffect(() => {
    if (user && !isResetPassword && !isNewPasswordSet) {
      navigate("/search");
    }
  }, [user, navigate, isResetPassword, isNewPasswordSet]);

  // Check password match when either password field changes
  useEffect(() => {
    if (isSignUp || isResetPassword) {
      setPasswordsMatch(password === confirmPassword || confirmPassword === "");
    }
  }, [password, confirmPassword, isSignUp, isResetPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Password validation for signup or reset
    if ((isSignUp || isResetPassword) && password !== confirmPassword) {
      setPasswordsMatch(false);
      setIsLoading(false);
      return;
    }

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
        
        if (response.data?.user && !response.data?.session) {
          setSignupComplete(true);
          toast({
            title: "Verification email sent",
            description: "Please check your email to verify your account",
          });
        } else if (response.data?.session) {
          // User was immediately signed in (email verification disabled)
          navigate("/search");
        }
      } else {
        await signIn(email, password);
        navigate("/search");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMessage = error.message || "Something went wrong";
      
      // Handle common error cases with more user-friendly messages
      if (errorMessage.includes("Email not confirmed")) {
        errorMessage = "Email not confirmed. Please check your inbox for the verification link.";
      } else if (errorMessage.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (errorMessage.includes("User already registered")) {
        errorMessage = "This email is already registered. Please sign in instead.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white shadow-md">
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
            <Alert className="bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Verification Email Sent</AlertTitle>
              <AlertDescription className="text-blue-700">
                We've sent a verification email to <strong>{email}</strong>. 
                Please check your inbox and click the verification link to activate your account.
              </AlertDescription>
            </Alert>
            <p className="text-gray-600 text-sm">
              If you don't see the email, please check your spam folder. The verification link will expire after 24 hours.
            </p>
            <Button 
              className="w-full mt-4" 
              onClick={() => {
                setSignupComplete(false);
                setIsSignUp(false);
              }}
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}
            
            {(!isReset || isResetPassword) && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            {(isSignUp || isResetPassword) && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className={!passwordsMatch ? "border-red-500" : ""}
                />
                {!passwordsMatch && (
                  <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || isNewPasswordSet || (isSignUp && !passwordsMatch)}>
              {isLoading
                ? "Processing..."
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
                  setPasswordsMatch(true);
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
