
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, CheckCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const AuthResetPassword = () => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const verifyResetToken = async () => {
      try {
        console.log("Starting password reset verification...");
        console.log("Current URL:", window.location.href);
        
        // Get URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");
        const error = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        // Log the URL parameters for debugging
        console.log("Reset password verification:", { 
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
        
        if (accessToken && type === "recovery") {
          // Set the session with the provided token
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ""
          });
          
          if (sessionError) {
            console.error("Session error during reset:", sessionError);
            throw sessionError;
          }
          
          console.log("Reset session established:", !!data.session);
          setVerifying(false);
          setVerified(true);
          
          // Show success toast
          toast({
            title: "Verification successful",
            description: "You can now set a new password for your account"
          });
          
          // Redirect to the reset password page if we're on the confirmation page
          if (location.pathname === "/auth/reset-confirmation") {
            navigate("/auth/reset-password");
          }
        } else {
          // Check if we already have a valid session
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }
          
          if (data.session) {
            console.log("Active session found for reset");
            setVerifying(false);
            setVerified(true);
          } else {
            throw new Error("Invalid or expired password reset link");
          }
        }
      } catch (err: any) {
        console.error("Reset verification error:", err);
        setError(err.message || "Verification failed");
        setVerifying(false);
        
        // Show error toast
        toast({
          title: "Verification failed",
          description: err.message || "Could not verify your password reset link",
          variant: "destructive",
        });
      }
    };

    verifyResetToken();
  }, [navigate, location.pathname, toast]);

  const handleContinue = () => {
    navigate("/auth/reset-password");
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white">
        <div className="text-center space-y-4">
          {verifying ? (
            <>
              <h1 className="text-2xl font-bold">Verifying your request</h1>
              <p className="text-gray-500">Please wait while we verify your request...</p>
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
              <h1 className="text-2xl font-bold text-green-600">Reset Password</h1>
              <p className="text-gray-600">
                You can now set a new password for your account.
              </p>
              <Button onClick={handleContinue} className="mt-4">
                Continue
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuthResetPassword;
