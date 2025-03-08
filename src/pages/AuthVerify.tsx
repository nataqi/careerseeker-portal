
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircleIcon } from "lucide-react";

const AuthVerify = () => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Check if there's a token in the URL (for email verification)
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        const type = params.get("type");
        
        console.log("Verification parameters:", { token: token?.substring(0, 5) + "...", type });
        
        if (!token && !type) {
          console.log("No token or type found in URL, checking for session");
          // If no token in URL, check if user already has a session
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }
          
          if (sessionData.session) {
            console.log("User already has an active session");
            setVerified(true);
            setVerifying(false);
            return;
          } else {
            throw new Error("No verification token found and user is not logged in");
          }
        }
        
        // If we have a token and type, we're in the verification process
        if (type === "signup" || type === "recovery" || type === "invite" || type === "magiclink") {
          console.log("Processing verification for type:", type);
          
          // For signups, we need to verify the email
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token as string,
            type: type === "signup" ? "signup" : type === "recovery" ? "recovery" : type === "invite" ? "invite" : "magiclink",
          });
          
          if (verifyError) {
            console.error("Verification error:", verifyError);
            throw verifyError;
          }
          
          console.log("Verification successful");
          setVerified(true);
          setVerifying(false);
        } else {
          // Session check as fallback
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }
          
          if (data.session) {
            console.log("User has active session after verification");
            setVerified(true);
          } else {
            throw new Error("Verification process didn't result in an active session");
          }
          
          setVerifying(false);
        }
      } catch (err: any) {
        console.error("Verification process error:", err);
        setError(err.message || "Verification failed. Please try again or contact support.");
        setVerifying(false);
      }
    };

    handleVerification();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white shadow-md">
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
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Verification Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <p className="text-gray-600 mb-4">
                This might happen if:
                <ul className="list-disc text-left ml-8 mt-2">
                  <li>The verification link has expired</li>
                  <li>The link was already used</li>
                  <li>There was a technical issue</li>
                </ul>
              </p>
              <Button onClick={() => navigate("/auth")} className="mt-4">
                Back to Sign In
              </Button>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircleIcon className="h-12 w-12 text-green-500" />
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
