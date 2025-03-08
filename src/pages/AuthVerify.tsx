
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Loader } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

const AuthVerify = () => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        console.log("Starting verification process...");
        console.log("Current URL:", window.location.href);
        
        // Get URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");
        const error = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        // Log the URL parameters for debugging
        console.log("URL parameters:", { 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken,
          type, 
          error,
          errorDescription
        });
        
        // Check for errors in URL
        if (error) {
          throw new Error(`${error}: ${errorDescription || 'Unknown error'}`);
        }
        
        // Handle password reset flow
        if (accessToken && type === "recovery") {
          console.log("Redirecting to password reset page");
          navigate("/auth/reset-password", { 
            state: { 
              from: "verification",
              accessToken,
              refreshToken 
            } 
          });
          return;
        }
        
        // Handle email verification for signup
        if (accessToken && type === "signup") {
          console.log("Processing signup verification");
          
          // Set session with tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ""
          });
          
          if (sessionError) {
            console.error("Session error:", sessionError);
            throw sessionError;
          }
          
          console.log("Session established successfully:", !!data.session);
          setVerifying(false);
          setSuccess(true);
          
          // Show success toast
          toast({
            title: "Email verified",
            description: "Your account has been verified successfully",
          });
        } else {
          // Check if user already has session
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("Session check error:", sessionError);
            throw sessionError;
          }
          
          console.log("Existing session check:", !!data.session);
          
          if (data.session) {
            setVerifying(false);
            setSuccess(true);
          } else {
            throw new Error("No verification token found or session expired");
          }
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Verification failed");
        setVerifying(false);
        
        // Show error toast
        toast({
          title: "Verification failed",
          description: err.message || "Could not verify your account",
          variant: "destructive",
        });
      }
    };

    handleVerification();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white">
        <div className="text-center space-y-4">
          {verifying ? (
            <>
              <h1 className="text-2xl font-bold">Verifying your account</h1>
              <p className="text-gray-500">Please wait while we verify your account...</p>
              <div className="flex justify-center">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            </>
          ) : error ? (
            <>
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={() => navigate("/auth")} className="mt-4">
                Back to Sign In
              </Button>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-green-600">Account Verified!</h1>
              <p className="text-gray-600">
                Your account has been successfully verified. You can now sign in.
              </p>
              <Button onClick={() => navigate("/auth")} className="mt-4">
                Sign In
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuthVerify;
