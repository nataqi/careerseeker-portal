import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { BriefcaseIcon, Loader2, ChevronLeft, ChevronRight, Upload, Clipboard } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";

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
      const formData = new FormData();
      formData.append('cv', selectedFile);
      formData.append('jobId', jobId);
      
      const { data, error } = await supabase.functions.invoke('cv-tailoring', {
        body: formData,
        // Don't set Content-Type header - let the browser handle it
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message);
      }

      if (!data || !data.result) {
        throw new Error("Invalid response from CV tailoring service");
      }

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
    <div className="min-h-screen bg-secondary">
      <div className="sticky top-0 z-50">
        <NavBar />
        
        <div className="bg-gradient-to-br from-primary to-primary-hover sticky top-0 z-50">
          <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">CV Tailoring</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Optimize your CV for specific job listings with AI-powered suggestions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2 space-y-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Upload Your CV</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
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
                    size="sm"
                    onClick={() => document.getElementById("cv-upload")?.click()}
                    className="mt-1"
                  >
                    Select PDF
                  </Button>
                </div>
                {selectedFile && (
                  <div className="mt-3 p-2 bg-accent rounded-md">
                    <p className="text-sm font-medium">Selected file:</p>
                    <p className="text-sm text-gray-700">{selectedFile.name}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Select a Job</h2>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : savedJobs.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-gray-500">No saved jobs yet</div>
                    <Button className="mt-4" onClick={() => navigate("/search")}>
                      Search Jobs
                    </Button>
                  </div>
                ) : (
                  <>
                    {displayedJobs.map((job) => (
                      <Card key={job.id} className={`p-4 card-hover bg-white ${job.job_id === selectedJobId ? 'ring-2 ring-primary' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <h3 className="text-base font-semibold text-gray-900">
                              <a 
                                href={`${AF_BASE_URL}/${job.job_id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {job.headline}
                              </a>
                            </h3>
                            <div className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
                              <BriefcaseIcon className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{job.employer_name}</span>
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
                            size="sm"
                            disabled={isTailoring}
                          >
                            {isTailoring && job.job_id === selectedJobId ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            ) : null}
                            Tailor!
                          </Button>
                        </div>
                      </Card>
                    ))}
                    
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Prev
                        </Button>
                        <span className="text-sm text-gray-600">
                          {currentPage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-lg p-4 shadow-sm h-full">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">CV Tailoring Results</h2>
                {tailoringResult && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center gap-1"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
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
                  className="w-full h-[600px] resize-none p-4 bg-white text-base"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-gray-600 mb-2">
                    Upload your CV and select a job to get tailored recommendations.
                  </p>
                  <p className="text-sm text-gray-500">
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
