
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, Upload, BriefcaseIcon, LogOut, LogIn, Loader2, Info, Star, BookmarkIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { searchJobs } from "@/services/jobService";
import type { JobListing } from "@/types/job";
import { useDebounce } from "@/hooks/useDebounce";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";

type SearchMode = "OR" | "AND";

const searchModeHelp = {
  OR: "Find jobs containing any of the words (e.g., 'developer designer')",
  AND: "Find jobs containing all words (e.g., 'frontend react')",
};

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("OR");
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isProcessingCV, setIsProcessingCV] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { toggleSaveJob, isJobSaved } = useSavedJobs();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const formatSearchQuery = (query: string, mode: SearchMode): string => {
    if (mode === "AND") {
      return query.split(" ").filter(Boolean).map(term => `+${term}`).join(" ");
    }
    return query;
  };

  useEffect(() => {
    const fetchJobs = async () => {
      if (!debouncedSearchQuery.trim()) {
        setJobs([]);
        return;
      }
      setIsLoading(true);
      try {
        const formattedQuery = formatSearchQuery(debouncedSearchQuery, searchMode);
        const response = await searchJobs(formattedQuery, searchMode);
        setJobs(response.hits);
      } catch (error) {
        console.error("Search error:", error);
        toast({
          title: "Error",
          description: "Failed to fetch job listings. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [debouncedSearchQuery, searchMode, toast]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingCV(true);
    const formData = new FormData();
    formData.append('cv', file);

    try {
      const { data: { data: functionData }, error: functionError } = await supabase.functions.invoke('process-cv', {
        body: formData,
      });

      if (functionError) throw functionError;

      const { skills, jobs: matchedJobs } = functionData;
      setExtractedSkills(skills);
      setJobs(matchedJobs);
      
      toast({
        title: "CV Processed Successfully",
        description: `Found ${matchedJobs.length} matching jobs based on your skills!`,
      });
    } catch (error) {
      console.error("CV processing error:", error);
      toast({
        title: "Error",
        description: "Failed to process your CV. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingCV(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                if (!user) {
                  toast({
                    title: "Authentication required",
                    description: "Please sign in to access saved jobs",
                    variant: "destructive",
                  });
                  return;
                }
                navigate("/saved-jobs");
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <BookmarkIcon className="w-4 h-4 mr-2" />
              Saved Jobs
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (!user) {
                  toast({
                    title: "Authentication required",
                    description: "Please sign in to access the Job Tracker",
                    variant: "destructive",
                  });
                  return;
                }
                navigate("/tracker");
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <BriefcaseIcon className="w-4 h-4 mr-2" />
              Jobs Tracker
            </Button>
          </div>
          {user ? (
            <Button
              variant="ghost"
              onClick={signOut}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Log In
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    type="text" 
                    placeholder="Search jobs by title, company, or keywords..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="pl-10 w-full" 
                  />
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select value={searchMode} onValueChange={value => setSearchMode(value as SearchMode)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Search mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OR">Any words (OR)</SelectItem>
                    <SelectItem value="AND">All words (AND)</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-primary hover:bg-primary-hover text-white" disabled={isLoading}>
                  {isLoading ? <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </> : <>
                      <SearchIcon className="w-4 h-4 mr-2" />
                      Search
                    </>}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Upload Your CV</h2>
            <div className="max-w-2xl mx-auto">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }} 
                className="hidden" 
                id="cv-upload" 
                disabled={isProcessingCV}
              />
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border-2 ${
                  isDragging ? 'border-primary bg-primary/10' : 'border-dashed border-gray-300'
                } rounded-lg p-8 transition-all cursor-pointer hover:border-primary/50`}
                onClick={() => document.getElementById('cv-upload')?.click()}
              >
                {isProcessingCV ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-gray-600">Processing CV...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700">
                        {isDragging ? (
                          "Drop your CV here"
                        ) : (
                          <>
                            Drag and drop your CV here
                            <br />
                            or click to select a file
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF files only</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {extractedSkills.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Skills Extracted from CV:</h3>
              <div className="flex flex-wrap gap-2">
                {extractedSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-block bg-accent text-primary text-sm px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {isLoading || isProcessingCV ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery.trim() ? "No jobs found. Try different keywords." : "Start searching for jobs..."}
              </div>
            ) : (
              jobs.map((job) => (
                <Card key={job.id}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (!user) {
                        toast({
                          title: "Authentication required",
                          description: "Please sign in to save jobs",
                          variant: "destructive",
                        });
                        return;
                      }
                      toggleSaveJob(job);
                    }}
                    className={`absolute top-4 right-4 hover:bg-transparent ${
                      isJobSaved(job.id)
                        ? "text-pink-500"
                        : "text-gray-400 hover:text-pink-500"
                    }`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        isJobSaved(job.id) ? "fill-pink-500" : ""
                      }`}
                    />
                  </Button>
                  <div className="flex items-start pr-12">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">{job.headline}</h3>
                      <div className="flex items-center gap-2 text-gray-600">
                        <BriefcaseIcon className="w-4 h-4" />
                        <span>{job.employer?.name}</span>
                        {job.workplace?.city && (
                          <>
                            <span>•</span>
                            <span>{job.workplace.city}</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {job.working_hours_type?.label && (
                          <span className="inline-block bg-accent text-primary text-sm px-3 py-1 rounded-full">
                            {job.working_hours_type.label}
                          </span>
                        )}
                        {job.salary_type?.label && (
                          <span className="inline-block bg-secondary text-gray-600 text-sm px-3 py-1 rounded-full">
                            {job.salary_type.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        window.open(`${AF_BASE_URL}/${job.id}`, '_blank');
                      }}
                      className="ml-auto bg-primary hover:bg-primary-hover text-white"
                    >
                      Apply Now
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
