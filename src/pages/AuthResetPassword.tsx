
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AuthResetPassword = () => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const verifyResetToken = async () => {
      try {
        console.log("Verifying reset token");
        console.log("Current URL:", window.location.href);
        
        // Check if we have any query parameters that might indicate a token
        const token = searchParams.get('token') || '';
        if (token) {
          console.log("Found token in URL parameters");
        }
        
        // Get current session (which might include recovery info)
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        console.log("Session data:", data);
        
        // Simulate verification for now (since the actual token verification happens automatically)
        setTimeout(() => {
          setVerifying(false);
          
          // Check if we have any issues that might prevent password reset
          if (!token && !data.session?.user) {
            setError("No reset token found or session established. Please try the reset link from your email again.");
          }
        }, 1500);
      } catch (err: any) {
        console.error("Reset token verification error:", err);
        setError(err.message || "Verification failed");
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: err.message || "There was a problem with your password reset link"
        });
        setVerifying(false);
      }
    };

    verifyResetToken();
  }, [navigate, toast, searchParams]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white shadow-sm border-[#FFF9C4]/50">
        <div className="text-center space-y-4">
          {verifying ? (
            <>
              <h1 className="text-2xl font-bold">Verifying your request</h1>
              <p className="text-gray-500">Please wait while we verify your request...</p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8BBD0]"></div>
              </div>
            </>
          ) : error ? (
            <>
              <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => navigate("/auth")} className="mt-4 bg-[#F8BBD0] hover:bg-[#F8BBD0]/90 text-gray-800">
                Back to Sign In
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-green-600">Reset Password</h1>
              <p className="text-gray-600">
                You can now set a new password for your account.
              </p>
              <Button onClick={() => navigate("/auth/reset-password")} className="mt-4 bg-[#F8BBD0] hover:bg-[#F8BBD0]/90 text-gray-800">
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
