
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BriefcaseIcon, ArrowLeft, Home, Loader2, ChevronLeft, ChevronRight, Upload, Clipboard, Star } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";
const JOBS_PER_PAGE = 5;

const CvTailoring = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedJobs, isLoading } = useSavedJobs();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [tailoringResult, setTailoringResult] = useState("");
  const [isTailoring, setIsTailoring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const totalPages = Math.ceil(savedJobs.length / JOBS_PER_PAGE);
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
  const displayedJobs = savedJobs.slice(startIndex, startIndex + JOBS_PER_PAGE);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded`,
      });
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleTailorCV = async (jobId: string) => {
    if (!selectedFile) {
      toast({
        title: "No CV uploaded",
        description: "Please upload your CV first",
        variant: "destructive",
      });
      return;
    }

    setSelectedJobId(jobId);
    setIsTailoring(true);
    setTailoringResult("");

    try {
      // Convert file to base64
      const fileBase64 = await convertFileToBase64(selectedFile);
      
      // Call the Supabase Edge Function with JSON payload and explicit Content-Type header
      const { data, error } = await supabase.functions.invoke('cv-tailoring', {
        body: { jobId, fileBase64 },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message);
      }

      if (!data || !data.result) {
        throw new Error("Invalid response from CV tailoring service");
      }

      // Set the tailoring result
      setTailoringResult(data.result);
    } catch (error) {
      console.error("Error tailoring CV:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to tailor your CV",
        variant: "destructive",
      });
    } finally {
      setIsTailoring(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tailoringResult);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Hero section with navigation */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
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
          <p className="text-gray-600">
            Upload your CV and select a job to get AI-powered tailoring suggestions
            that help match your CV to the job requirements.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2 space-y-6">
            {/* Saved Jobs Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Select a Job</h2>
              <div className="space-y-4">
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
                      <Card key={job.id} className={`p-6 card-hover bg-white ${job.job_id === selectedJobId ? 'ring-2 ring-primary' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              <a 
                                href={`${AF_BASE_URL}/${job.job_id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline"
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
                            onClick={() => handleTailorCV(job.job_id)}
                            className="bg-primary hover:bg-primary-hover text-white"
                            disabled={isTailoring}
                          >
                            {isTailoring && job.job_id === selectedJobId ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
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

            {/* CV Upload Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Upload Your CV</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <p className="text-gray-600">
                    Drag and drop your PDF file here, or click to browse
                  </p>
                  <input
                    type="file"
                    id="cv-upload"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("cv-upload")?.click()}
                    className="mt-2"
                  >
                    Select PDF
                  </Button>
                </div>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-accent rounded-md">
                    <p className="text-sm font-medium">Selected file:</p>
                    <p className="text-sm text-gray-700">{selectedFile.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tailoring Result Section */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-lg p-6 shadow-sm h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">CV Tailoring Results</h2>
                {tailoringResult && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center gap-1"
                  >
                    <Clipboard className="w-4 h-4" />
                    Copy
                  </Button>
                )}
              </div>
              {isTailoring ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="text-gray-600">Analyzing your CV...</p>
                </div>
              ) : tailoringResult ? (
                <Textarea
                  value={tailoringResult}
                  onChange={(e) => setTailoringResult(e.target.value)}
                  className="w-full h-[500px] resize-none p-4 bg-white"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-gray-600 mb-2">
                    Upload your CV and select a job to get tailored recommendations.
                  </p>
                  <p className="text-gray-500 text-sm">
                    Our AI will analyze your CV and suggest improvements to match the job requirements.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CvTailoring;
