
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AuthVerify = () => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Parse URL hash fragment for token if present
  const getTokenFromUrl = () => {
    const hash = location.hash;
    if (!hash) return null;
    
    const params = new URLSearchParams(hash.substring(1));
    return params.get('access_token');
  };

  useEffect(() => {
    const handleVerification = async () => {
      try {
        console.log("Starting verification process");
        console.log("Current URL:", window.location.href);
        
        // Check for token in URL (for email confirmation links)
        const token = getTokenFromUrl();
        if (token) {
          console.log("Found token in URL");
        }
        
        // Get current session
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
        
        // If the user has a session, they're verified
        if (data.session) {
          console.log("User verified and has active session");
          toast({
            title: "Success",
            description: "Your account has been verified successfully!"
          });
        } else {
          console.log("No active session found");
          // This might be a case where the verification link was clicked but didn't set up session properly
          if (token) {
            toast({
              variant: "destructive",
              title: "Verification issue",
              description: "Your verification link might have expired or is invalid."
            });
          }
        }
        
        setVerifying(false);
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Verification failed");
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: err.message || "There was a problem verifying your account"
        });
        setVerifying(false);
      }
    };

    handleVerification();
  }, [navigate, toast, location]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white shadow-sm border-[#FFF9C4]/50">
        <div className="text-center space-y-4">
          {verifying ? (
            <>
              <h1 className="text-2xl font-bold">Verifying your account</h1>
              <p className="text-gray-500">Please wait while we verify your account...</p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8BBD0]"></div>
              </div>
            </>
          ) : error ? (
            <>
              <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => navigate("/auth")} className="mt-4 bg-[#F8BBD0] hover:bg-[#F8BBD0]/90">
                Back to Sign In
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-green-600">Account Verified!</h1>
              <p className="text-gray-600">
                Your account has been successfully verified. You can now sign in.
              </p>
              <Button onClick={() => navigate("/auth")} className="mt-4 bg-[#F8BBD0] hover:bg-[#F8BBD0]/90">
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
