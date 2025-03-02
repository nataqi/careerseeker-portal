
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BriefcaseIcon, ArrowLeft, Home, Loader2, Star, Copy, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import type { SavedJob } from "@/types/saved-job";

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";
const JOBS_PER_PAGE = 10;

const CvTailoring = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedJobs, isLoading, isJobSaved } = useSavedJobs();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null);
  const [tailoredContent, setTailoredContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get job details
  const fetchJobDetails = async (jobId: string) => {
    try {
      // This would be replaced with an actual call to get job description
      // For now, we'll just return a generic message
      return "This is a placeholder for the job description that would be fetched from Arbetsformedlingen's API.";
    } catch (error) {
      console.error("Error fetching job details:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) return null;

  const totalPages = Math.ceil(savedJobs.length / JOBS_PER_PAGE);
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
  const displayedJobs = savedJobs.slice(startIndex, startIndex + JOBS_PER_PAGE);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFile(null);
  };

  const handleTailorCV = async (job: SavedJob) => {
    setSelectedJob(job);
    
    if (!selectedFile) {
      toast({
        title: "No CV selected",
        description: "Please upload your CV in PDF format",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const jobDescription = await fetchJobDetails(job.job_id);
      
      // Create FormData with the file and job details
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('jobTitle', job.headline);
      formData.append('employer', job.employer_name);
      formData.append('jobId', job.job_id);
      formData.append('jobDescription', jobDescription || 'No description available');

      // Call Supabase Edge Function to process the CV
      const { data, error } = await supabase.functions.invoke('process-cv', {
        body: formData,
      });

      if (error) {
        throw error;
      }

      setTailoredContent(data.tailoredContent || 'Failed to generate tailored content.');
    } catch (error) {
      console.error("Error tailoring CV:", error);
      toast({
        title: "Error",
        description: "Failed to tailor your CV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (tailoredContent && textareaRef.current) {
      navigator.clipboard.writeText(textareaRef.current.value)
        .then(() => {
          toast({
            title: "Copied!",
            description: "Content copied to clipboard",
          });
        })
        .catch((err) => {
          console.error("Failed to copy: ", err);
          toast({
            title: "Error",
            description: "Failed to copy content",
            variant: "destructive",
          });
        });
    }
  };

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Hero section and navigation */}
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
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">CV Tailoring</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - File upload and jobs list */}
          <div className="space-y-6">
            {/* CV Upload Section */}
            <Card className="p-6 bg-white">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Upload Your CV</h2>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cv-upload">Select a PDF file</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="cv-upload" 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleFileChange} 
                      ref={fileInputRef}
                      className="flex-1"
                    />
                    {selectedFile && (
                      <Button variant="outline" onClick={resetFileInput} size="sm">
                        Clear
                      </Button>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-green-600">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Saved Jobs Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BriefcaseIcon className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Saved Jobs</h2>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : savedJobs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">No saved jobs yet</div>
                  <Button className="mt-4" onClick={() => navigate("/search")}>
                    Search Jobs
                  </Button>
                </div>
              ) : (
                <>
                  {displayedJobs.map((job) => (
                    <Card key={job.id} className={`p-6 card-hover bg-white ${selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            <a 
                              href={`${AF_BASE_URL}/${job.job_id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-primary hover:underline"
                            >
                              {job.headline}
                            </a>
                          </h3>
                          <div className="flex items-center gap-2 text-gray-600">
                            <BriefcaseIcon className="w-4 h-4" />
                            <span>{job.employer_name}</span>
                            {job.workplace_city && (
                              <>
                                <span>•</span>
                                <span>{job.workplace_city}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleTailorCV(job)}
                          disabled={isProcessing || !selectedFile}
                          className="bg-primary hover:bg-primary-hover text-white"
                        >
                          {isProcessing && selectedJob?.id === job.id ? 
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 
                            null}
                          Tailor!
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right column - Tailored content */}
          <div className="space-y-4">
            <Card className="p-6 bg-white h-full">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Tailored CV Content</h2>
                </div>
                {tailoredContent && (
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                )}
              </div>
              
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-gray-600">Processing your CV against the job description...</p>
                </div>
              ) : tailoredContent ? (
                <Textarea 
                  ref={textareaRef}
                  value={tailoredContent} 
                  onChange={(e) => setTailoredContent(e.target.value)}
                  className="min-h-[500px] p-4"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                  <div className="rounded-full bg-gray-100 p-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="max-w-xs space-y-2">
                    <h3 className="font-semibold text-gray-800">Get Your CV Tailored</h3>
                    <p className="text-gray-600 text-sm">
                      Upload your CV and select a job to have OpenAI tailor your CV to match the job requirements.
                    </p>
                  </div>
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
