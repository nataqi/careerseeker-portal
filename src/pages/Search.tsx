import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, Upload, BriefcaseIcon, LogOut, Loader2, HelpCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { searchJobs } from "@/services/jobService";
import type { JobListing } from "@/types/job";
import { useDebounce } from "@/hooks/useDebounce";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { parseSearchQuery, buildSearchQuery } from "@/utils/searchParser";

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser/";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!debouncedSearchQuery.trim()) {
        setJobs([]);
        return;
      }

      setIsLoading(true);
      try {
        const parsed = parseSearchQuery(debouncedSearchQuery);
        const processedQuery = buildSearchQuery(parsed);
        const response = await searchJobs(processedQuery);
        setJobs(response.hits);
      } catch (error) {
        console.error("Search error:", error);
        toast({
          title: "Error",
          description: "Failed to fetch job listings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [debouncedSearchQuery, toast]);

  if (!user) return null;
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      toast({
        title: "Coming soon!",
        description: "CV upload and automatic job matching will be implemented with Supabase integration.",
      });
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleApply = (job: JobListing) => {
    const applicationUrl = `${AF_BASE_URL}${job.id}`;
    window.open(applicationUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            onClick={signOut}
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
        
        <div className="space-y-6">
          <div className="flex flex-col space-y-2">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search jobs by title, company, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      size="icon"
                    >
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="w-80 p-4" side="bottom">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Search Tips:</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Use <span className="font-mono">space</span> for OR search: <span className="font-mono">frontend backend</span></li>
                        <li>• Use <span className="font-mono">+</span> for AND search: <span className="font-mono">+react +typescript</span></li>
                        <li>• Use <span className="font-mono">-</span> to exclude: <span className="font-mono">developer -junior</span></li>
                        <li>• Use quotes for exact phrase: <span className="font-mono">"full stack developer"</span></li>
                      </ul>
                      <p className="text-sm text-gray-500 mt-2">
                        Example: <span className="font-mono">"frontend developer" +react -junior</span>
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="bg-primary hover:bg-primary-hover text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <SearchIcon className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label htmlFor="cv-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2 border-primary text-primary hover:bg-accent"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload CV
                    </Button>
                  </label>
                </div>
              </div>
            </div>
            {searchQuery && (
              <div className="text-sm text-gray-500">
                Tip: Use quotes for exact phrases, + for required words, and - to exclude terms
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery.trim() ? "No jobs found. Try different keywords or search operators." : "Start searching for jobs..."}
              </div>
            ) : (
              jobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-6 card-hover bg-white"
                >
                  <div className="flex items-start justify-between">
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
                      onClick={() => handleApply(job)}
                      className="bg-primary hover:bg-primary-hover text-white"
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
