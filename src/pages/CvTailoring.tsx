
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Search, BriefcaseIcon, Star, Loader2, Copy, FileText } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { supabase } from "@/integrations/supabase/client";
import CvUploader from "@/components/CvUploader";
import JobSelector from "@/components/JobSelector";
import { toast } from "sonner";
import type { SavedJob } from "@/types/saved-job";

const CvTailoring = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedJobs, isLoading } = useSavedJobs();
  const [selectedCv, setSelectedCv] = useState<File | null>(null);
  const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null);
  const [tailoredContent, setTailoredContent] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleSelectJob = (job: SavedJob) => {
    setSelectedJob(job);
  };

  const handleCvUpload = (file: File) => {
    setSelectedCv(file);
  };

  const handleTailorCv = async () => {
    if (!selectedCv || !selectedJob) {
      toast.error("Please select both a CV and a job");
      return;
    }

    setIsProcessing(true);
    setTailoredContent("");

    try {
      const formData = new FormData();
      formData.append('cv', selectedCv);
      formData.append('jobId', selectedJob.job_id);

      // Fix: Use string concatenation instead of accessing the protected url property
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cv-tailoring`;
      
      const response = await fetch(
        functionUrl,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`
          }
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process CV');
      }

      setTailoredContent(data.suggestions || "");
      toast.success("CV successfully tailored!");
    } catch (error) {
      console.error("Error tailoring CV:", error);
      toast.error("Failed to tailor CV. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(tailoredContent);
    toast.success("Copied to clipboard!");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">CV Tailoring</h1>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                onClick={() => navigate("/search")}
                className="text-gray-600 hover:text-gray-900"
              >
                <Search className="w-4 h-4 mr-2" />
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
                Jobs Tracker
              </Button>
            </div>
          </div>
          <Card className="p-4 bg-accent mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <FileText className="h-10 w-10 text-primary" />
              <div className="text-center sm:text-left">
                <h2 className="text-lg font-medium">Tailor Your CV to Job Descriptions</h2>
                <p className="text-sm text-gray-600">
                  Upload your CV and select a job to get AI-powered suggestions for customizing your CV.
                </p>
              </div>
            </div>
          </Card>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side - Job Selection */}
          <div className="lg:col-span-4 space-y-6">
            <JobSelector 
              savedJobs={savedJobs} 
              onSelectJob={handleSelectJob} 
              selectedJobId={selectedJob?.job_id || null} 
            />
            
            <CvUploader onFileUploaded={handleCvUpload} />
            
            <div className="flex justify-center">
              <Button 
                onClick={handleTailorCv}
                disabled={!selectedCv || !selectedJob || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Tailor CV"
                )}
              </Button>
            </div>
          </div>

          {/* Right Side - Result */}
          <div className="lg:col-span-8">
            <Card className="p-4 bg-white shadow-sm h-full">
              <div className="flex justify-between items-center mb-3">
                <div className="text-lg font-semibold">Tailored CV Suggestions</div>
                {tailoredContent && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyContent}
                    className="text-xs"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                )}
              </div>
              
              <div className="h-[600px] relative">
                {isProcessing ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
                      <p className="text-gray-600">Analyzing your CV and job description...</p>
                      <p className="text-xs text-gray-500 mt-1">This may take a minute</p>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    className="h-full resize-none p-4"
                    placeholder="CV tailoring suggestions will appear here after processing..."
                    value={tailoredContent}
                    onChange={(e) => setTailoredContent(e.target.value)}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CvTailoring;
