
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AuthResetPassword = () => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Short timeout to simulate verification
    // The actual verification is handled by Auth.tsx and Supabase
    const timer = setTimeout(() => {
      setVerifying(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 bg-white">
        <div className="text-center space-y-4">
          {verifying ? (
            <>
              <h1 className="text-2xl font-bold">Verifying your request</h1>
              <p className="text-gray-500">Please wait while we verify your request...</p>
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
              <h1 className="text-2xl font-bold text-green-600">Reset Password</h1>
              <p className="text-gray-600">
                You can now set a new password for your account.
              </p>
              <Button onClick={() => navigate("/auth/reset-password")} className="mt-4">
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
