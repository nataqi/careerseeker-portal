
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BriefcaseIcon, 
  ArrowLeft, 
  Home, 
  Loader2, 
  Star, 
  CopyIcon, 
  FileTextIcon
} from "lucide-react";
import { CvUploader } from "@/components/CvUploader";
import { JobSelector } from "@/components/JobSelector";

const CvTailoring = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tailoredCv, setTailoredCv] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [jobDetails, setJobDetails] = useState<{
    title: string;
    employer: string;
    location: string;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tailoredCv);
      toast({
        title: "Copied!",
        description: "CV tailoring copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !selectedJobId) {
      toast({
        title: "Missing information",
        description: "Please select both a job and upload your CV",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setTailoredCv("");
    setJobDetails(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("cv", selectedFile);
      formData.append("jobId", selectedJobId);

      // Call the Edge Function
      const functionUrl = `${supabase.functions.url}/process-cv`;
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabase.auth.session()?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process CV");
      }

      const data = await response.json();
      setTailoredCv(data.tailoredCV);
      setJobDetails(data.job);

      toast({
        title: "Success!",
        description: "Your CV has been tailored for the selected job",
      });
    } catch (error) {
      console.error("Error processing CV:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process CV",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header with navigation */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/search")}
              className="text-gray-600 hover:text-gray-900"
            >
              <Home className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/saved-jobs")}
              className="text-gray-600 hover:text-gray-900"
            >
              <Star className="w-4 h-4 mr-2" />
              Saved Jobs
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/tracker")}
              className="text-gray-600 hover:text-gray-900"
            >
              <BriefcaseIcon className="w-4 h-4 mr-2" />
              Job Tracker
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">CV Tailoring</h1>
        </div>

        {/* Page content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left side - Job selection */}
          <div className="md:col-span-5">
            <JobSelector 
              onJobSelect={handleJobSelect} 
              selectedJobId={selectedJobId} 
            />
            
            <div className="mt-6">
              <CvUploader 
                onFileSelect={handleFileSelect} 
                isUploading={isProcessing} 
              />
            </div>
            
            <Button 
              className="w-full mt-6"
              disabled={!selectedJobId || !selectedFile || isProcessing}
              onClick={handleSubmit}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing CV
                </>
              ) : (
                <>
                  <FileTextIcon className="w-4 h-4 mr-2" />
                  Tailor my CV
                </>
              )}
            </Button>
          </div>
          
          {/* Right side - Results */}
          <div className="md:col-span-7">
            <Card className="p-5 h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {jobDetails ? (
                    <>Tailored CV for: {jobDetails.title}</>
                  ) : (
                    <>Tailored CV</>
                  )}
                </h3>
                
                {tailoredCv && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCopyToClipboard}
                  >
                    <CopyIcon className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </Button>
                )}
              </div>
              
              {jobDetails && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                  <BriefcaseIcon className="w-3.5 h-3.5" />
                  <span>{jobDetails.employer}</span>
                  {jobDetails.location && (
                    <>
                      <span>•</span>
                      <span>{jobDetails.location}</span>
                    </>
                  )}
                </div>
              )}
              
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-gray-500">Processing your CV with AI...</p>
                </div>
              ) : tailoredCv ? (
                <Textarea 
                  value={tailoredCv}
                  onChange={(e) => setTailoredCv(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileTextIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Select a job and upload your CV to get tailored suggestions</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CvTailoring;
