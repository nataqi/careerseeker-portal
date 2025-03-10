
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/AuthLayout";
import { supabase } from "@/integrations/supabase/client";

const ConfirmEmail = () => {
  const [confirmationStatus, setConfirmationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // The hash contains the access_token and refresh_token
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          setConfirmationStatus('error');
          setErrorMessage(error.message);
        } else {
          setConfirmationStatus('success');
        }
      } catch (err: any) {
        setConfirmationStatus('error');
        setErrorMessage(err.message || "Failed to confirm email");
      }
    };

    handleEmailConfirmation();
  }, []);

  return (
    <AuthLayout 
      title={
        confirmationStatus === 'loading' ? "Verifying your email" :
        confirmationStatus === 'success' ? "Email Confirmed!" : 
        "Verification Failed"
      } 
      subtitle={
        confirmationStatus === 'loading' ? "Please wait while we verify your email..." :
        confirmationStatus === 'success' ? "Your email has been successfully verified" : 
        errorMessage || "There was a problem verifying your email"
      }
      icon={
        confirmationStatus === 'loading' ? 
          <Loader2 className="w-8 h-8 text-primary animate-spin" /> :
        confirmationStatus === 'success' ? 
          <CheckCircle className="w-8 h-8 text-green-500" /> : 
          <XCircle className="w-8 h-8 text-red-500" />
      }
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        {confirmationStatus === 'loading' && (
          <div className="text-center text-gray-500">
            This won't take long...
          </div>
        )}
        
        {confirmationStatus === 'success' && (
          <>
            <p className="text-center text-gray-600">
              You can now sign in to your account and start using all features
            </p>
            <Button 
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Sign In
            </Button>
          </>
        )}
        
        {confirmationStatus === 'error' && (
          <>
            <p className="text-center text-gray-600">
              The link might have expired or is invalid. Please try again or contact support.
            </p>
            <Button 
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default ConfirmEmail;
