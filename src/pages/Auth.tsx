
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, UserRound, Mail, LockKeyhole } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isReset) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast({
          title: "Success",
          description: "Password reset instructions have been sent to your email",
        });
        setIsReset(false);
      } else if (isSignUp) {
        await signUp(email, password);
        toast({
          title: "Success",
          description: "Please check your email to verify your account",
        });
      } else {
        await signIn(email, password);
        navigate("/search");
      }
    } catch (error: any) {
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
    <div className="min-h-screen bg-gradient-green-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-medium scale-in">
        <div className="text-center space-y-2">
          <div className="inline-flex justify-center items-center w-16 h-16 bg-accent rounded-full mb-4">
            <UserRound className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isReset
              ? "Reset Password"
              : isSignUp
              ? "Create an account"
              : "Welcome back"}
          </h1>
          <p className="text-gray-500 text-lg">
            {isReset
              ? "Enter your email to receive reset instructions"
              : isSignUp
              ? "Sign up to start your job search journey"
              : "Sign in to continue your job search"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 rounded-lg input-focus"
                required
              />
            </div>
          </div>
          {!isReset && (
            <div className="space-y-2">
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-lg input-focus"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          )}
          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary-hover transition-colors duration-300 rounded-lg"
            disabled={isLoading}
          >
            {isLoading
              ? "Loading..."
              : isReset
              ? "Send Reset Instructions"
              : isSignUp
              ? "Sign Up"
              : "Sign In"}
          </Button>
        </form>

        <div className="text-center space-y-3 pt-2">
          <Button
            variant="link"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setIsReset(false);
            }}
            className="text-primary text-base font-medium"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </Button>
          {!isReset && !isSignUp && (
            <Button
              variant="link"
              onClick={() => setIsReset(true)}
              className="text-gray-500 text-base block mx-auto"
            >
              Forgot password?
            </Button>
          )}
          {isReset && (
            <Button
              variant="link"
              onClick={() => setIsReset(false)}
              className="text-gray-500 text-base"
            >
              Back to sign in
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Auth;
