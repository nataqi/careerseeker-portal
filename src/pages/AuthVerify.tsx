
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AuthVerify = () => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // The verification process is handled automatically by Supabase
        // when redirecting back to this page
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setVerifying(false);
        
        // If user is verified and has a session, we can consider them logged in
        if (data.session) {
          console.log("User verified and has active session");
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Verification failed");
        setVerifying(false);
      }
    };

    handleVerification();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white">
        <div className="text-center space-y-4">
          {verifying ? (
            <>
              <h1 className="text-2xl font-bold">Verifying your account</h1>
              <p className="text-gray-500">Please wait while we verify your account...</p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </>
          ) : error ? (
            <>
              <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => navigate("/auth")} className="mt-4">
                Back to Sign In
              </Button>
            </>
          ) : (
            <>
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
