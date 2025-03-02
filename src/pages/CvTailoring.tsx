
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BriefcaseIcon, ArrowLeft, Home, Loader2, BookmarkIcon, FileText, Copy } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { SavedJob } from "@/types/saved-job";

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";

const CvTailoring = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedJobs, isLoading } = useSavedJobs();
  const { toast } = useToast();
  
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null);
  const [tailoredCv, setTailoredCv] = useState<string>("");
  const [pdfText, setPdfText] = useState<string>("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
        return;
      }
      
      setPdfFile(file);
      setIsUploading(true);
      
      try {
        // Use a PDF.js CDN to extract text
        const pdfjsLib = await import('pdfjs-dist/build/pdf');
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
        
        const fileReader = new FileReader();
        fileReader.onload = async (event) => {
          const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
          const loadingTask = pdfjsLib.getDocument(typedarray);
          const pdf = await loadingTask.promise;
          
          let extractedText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            extractedText += pageText + '\n';
          }
          
          setPdfText(extractedText);
          setIsUploading(false);
          
          toast({
            title: "CV uploaded",
            description: "Your CV has been successfully processed",
          });
        };
        
        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error processing PDF:", error);
        setIsUploading(false);
        toast({
          title: "Error processing PDF",
          description: "There was a problem extracting text from your PDF",
          variant: "destructive",
        });
      }
    }
  };

  const handleTailorCv = async (job: SavedJob) => {
    if (!pdfText) {
      toast({
        title: "No CV uploaded",
        description: "Please upload your CV first",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedJob(job);
    setIsProcessing(true);
    
    try {
      // Get the user's session token for the API call
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }
      
      // Get the job details by fetching from Arbetsformedlingen API
      // Since we don't have direct access to their API, we'll use the job information we have
      const jobDetails = `
Job Title: ${job.headline}
Employer: ${job.employer_name}
Location: ${job.workplace_city || 'Not specified'}
Job ID: ${job.job_id}
      `;
      
      // Call our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('process-cv', {
        body: {
          jobDetails,
          resumeText: pdfText
        }
      });
      
      if (error) {
        throw error;
      }
      
      setTailoredCv(data.suggestions);
      
      toast({
        title: "CV tailored successfully",
        description: "Review the tailored suggestions for your CV",
      });
    } catch (error) {
      console.error("Error tailoring CV:", error);
      toast({
        title: "Error tailoring CV",
        description: "There was a problem generating tailored suggestions",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tailoredCv);
    toast({
      title: "Copied to clipboard",
      description: "The tailored CV suggestions have been copied to your clipboard",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="bg-white border-b">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between py-4 border-b">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-gray-600 hover:text-gray-900"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/search")}
                className="text-gray-600 hover:text-gray-900"
              >
                <BriefcaseIcon className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/saved-jobs")}
                className="text-gray-600 hover:text-gray-900"
              >
                <BookmarkIcon className="w-4 h-4 mr-2" />
                Saved Jobs
              </Button>
            </div>
          </div>
          <div className="text-center py-16 space-y-4">
            <h1 className="text-5xl font-bold text-gray-900">
              Tailor Your CV
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your CV and select a job to get AI-powered suggestions to tailor your CV.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 py-12">
        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar - CV Upload and Saved Jobs */}
          <div className="col-span-12 md:col-span-5 space-y-6">
            {/* CV Upload */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Upload Your CV</h2>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 mb-4">
                    Upload your CV in PDF format
                  </p>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="cv-upload"
                  />
                  <Button 
                    asChild
                    className="bg-primary hover:bg-primary-hover text-white"
                    disabled={isUploading}
                  >
                    <label htmlFor="cv-upload">
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Upload CV</>
                      )}
                    </label>
                  </Button>
                  {pdfFile && !isUploading && (
                    <p className="mt-2 text-sm text-gray-600">
                      File: {pdfFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Saved Jobs */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Select a Job</h2>
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
                <div className="space-y-4">
                  {savedJobs.map((job) => (
                    <Card key={job.id} className="p-4">
                      <div className="space-y-2">
                        <a
                          href={`${AF_BASE_URL}/${job.job_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {job.headline}
                        </a>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <BriefcaseIcon className="w-3 h-3 shrink-0" />
                          <span>{job.employer_name}</span>
                          {job.workplace_city && (
                            <>
                              <span>•</span>
                              <span>{job.workplace_city}</span>
                            </>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleTailorCv(job)}
                          className="w-full mt-2 bg-primary hover:bg-primary-hover text-white"
                          disabled={isProcessing || !pdfText}
                        >
                          {isProcessing && selectedJob?.id === job.id ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>Tailor!</>
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Tailored CV Output */}
          <div className="col-span-12 md:col-span-7">
            <div className="bg-white rounded-lg border shadow-sm h-full">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Tailored CV Suggestions</h2>
                  {tailoredCv && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopy}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-6">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center h-96">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-gray-500">Processing your CV with AI...</p>
                  </div>
                ) : tailoredCv ? (
                  <Textarea
                    value={tailoredCv}
                    onChange={(e) => setTailoredCv(e.target.value)}
                    className="min-h-[500px] font-light"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-96 text-center">
                    <FileText className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-2">Upload your CV and select a job</p>
                    <p className="text-gray-400 text-sm max-w-md">
                      The AI will analyze your CV and the job description to provide 
                      tailored suggestions for improving your application.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CvTailoring;
