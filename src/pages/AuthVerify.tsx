
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";

const AuthVerify = () => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Get the token hash from the URL query params
        const queryParams = new URLSearchParams(location.search);
        const token_hash = queryParams.get('token_hash');
        const type = queryParams.get('type');
        
        console.log("Verification params:", { token_hash, type });
        
        if (!token_hash) {
          throw new Error("Verification token not found in URL");
        }

        // Verify the email
        const { error: verificationError } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email' as any, // 'signup' or 'email_change' based on context
        });
        
        if (verificationError) {
          throw verificationError;
        }
        
        // Check if we have a valid session after verification
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        setVerifying(false);
        
        // If user is verified and has a session, mark as success
        if (data.session) {
          console.log("User verified and has active session");
          setVerificationSuccess(true);
        } else {
          // User verified but no session yet
          console.log("User verified but no active session yet");
          setVerificationSuccess(true);
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Verification failed");
        setVerifying(false);
      }
    };

    handleVerification();
  }, [navigate, location.search]);

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
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
              <p className="text-gray-600">{error}</p>
              <p className="text-sm text-gray-500 mt-2">
                The verification link may have expired or been used already.
              </p>
              <Button onClick={() => navigate("/auth")} className="mt-4">
                Back to Sign In
              </Button>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
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
