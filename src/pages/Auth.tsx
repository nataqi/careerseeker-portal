
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isReset) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
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
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {isReset ? "Reset Password" : isSignUp ? "Create an account" : "Welcome back"}
          </h1>
          <p className="text-gray-500">
            {isReset 
              ? "Enter your email to receive reset instructions"
              : isSignUp
                ? "Sign up to start your job search journey"
                : "Sign in to continue your job search"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {!isReset && (
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
          <Button
            type="submit"
            className="w-full"
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

        <div className="text-center space-y-2">
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
          {!isReset && !isSignUp && (
            <Button
              variant="link"
              onClick={() => setIsReset(true)}
              className="text-gray-500 block mx-auto"
            >
              Forgot password?
            </Button>
          )}
          {isReset && (
            <Button
              variant="link"
              onClick={() => setIsReset(false)}
              className="text-gray-500"
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
