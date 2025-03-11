import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, Upload, BriefcaseIcon, Loader2, Info, Star, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { searchJobs } from "@/services/jobService";
import type { JobListing } from "@/types/job";
import { useDebounce } from "@/hooks/useDebounce";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { supabase } from "@/integrations/supabase/client";
import { NavBar } from "@/components/NavBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";

type SearchMode = "OR" | "AND";
type PublishDateFilter = "last-hour" | "today" | "last-7-days" | "last-30-days" | "";

const searchModeHelp = {
  OR: "Find jobs containing any of the words (e.g., 'developer designer')",
  AND: "Find jobs containing all words (e.g., 'frontend react')"
};

const publishDateOptions = [{
  value: "",
  label: "Any time"
}, {
  value: "last-hour",
  label: "Last hour"
}, {
  value: "today",
  label: "Today"
}, {
  value: "last-7-days",
  label: "Last 7 days"
}, {
  value: "last-30-days",
  label: "Last 30 days"
}];

const RESULTS_PER_PAGE = 10;
const SEARCH_LIMIT = 100;

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("OR");
  const [publishDateFilter, setPublishDateFilter] = useState<PublishDateFilter>("");
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isProcessingCV, setIsProcessingCV] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const {
    toast
  } = useToast();
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const {
    toggleSaveJob,
    isJobSaved
  } = useSavedJobs();

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
        setTotalJobs(0);
        return;
      }
      setIsLoading(true);
      try {
        const formattedQuery = formatSearchQuery(debouncedSearchQuery, searchMode);
        const response = await searchJobs(formattedQuery, searchMode, publishDateFilter, SEARCH_LIMIT, (currentPage - 1) * RESULTS_PER_PAGE);
        setJobs(response.hits);
        setTotalJobs(response.total.value);
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
  }, [debouncedSearchQuery, searchMode, publishDateFilter, currentPage, toast]);

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
      const {
        data: {
          data: functionData
        },
        error: functionError
      } = await supabase.functions.invoke('process-cv', {
        body: formData
      });
      if (functionError) throw functionError;
      const {
        skills,
        jobs: matchedJobs
      } = functionData;
      setExtractedSkills(skills);
      setJobs(matchedJobs);
      setTotalJobs(matchedJobs.length);
      toast({
        title: "CV Processed Successfully",
        description: `Found ${matchedJobs.length} matching jobs based on your skills!`
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

  const handleFiltersToggle = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const totalPages = Math.ceil(totalJobs / RESULTS_PER_PAGE);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(<PaginationItem key={i}>
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>);
      }
    } else {
      items.push(<PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>);

      if (currentPage > 3) {
        items.push(<PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>);
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      for (let i = startPage; i <= endPage; i++) {
        items.push(<PaginationItem key={i}>
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>);
      }

      if (currentPage < totalPages - 2) {
        items.push(<PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>);
      }

      items.push(<PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>);
    }
    return items;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="bg-white sticky top-0 z-50">
        <NavBar />
        
        <div className="bg-gradient-to-br from-green-100 to-green-300 sticky top-0 z-50">
          <div className="max-w-[1200px] mx-auto px-4 py-1 md:py-6 text-center relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Search Jobs</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find the perfect job opportunity by searching through thousands of positions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 w-full">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input type="text" placeholder="Search jobs by title, company, or keywords..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 w-full h-11" />
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={searchMode} onValueChange={value => setSearchMode(value as SearchMode)}>
                  <SelectTrigger className="w-[180px] h-11">
                    <SelectValue placeholder="Search mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OR">Any words (OR)</SelectItem>
                    <SelectItem value="AND">All words (AND)</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-primary hover:bg-primary-hover text-white h-11" disabled={isLoading}>
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

            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="flex-1">
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="h-11">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                      {isFiltersOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  
                  <input type="file" accept=".pdf" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }} className="hidden" id="cv-upload" disabled={isProcessingCV} />
                  <Button onClick={() => document.getElementById('cv-upload')?.click()} className="bg-primary hover:bg-primary-hover text-white h-11" disabled={isProcessingCV}>
                    {isProcessingCV ? <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing CV...
                      </> : <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload CV
                      </>}
                  </Button>
                </div>
                <CollapsibleContent className="mt-4 p-4 border rounded-md">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 font-medium text-base">Publishing Date</h3>
                      <RadioGroup value={publishDateFilter} onValueChange={value => setPublishDateFilter(value as PublishDateFilter)} className="flex flex-wrap gap-4">
                        {publishDateOptions.map(option => <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`date-${option.value}`} />
                            <Label htmlFor={`date-${option.value}`}>{option.label}</Label>
                          </div>)}
                      </RadioGroup>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          {extractedSkills.length > 0 && <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Skills Extracted from CV:</h3>
              <div className="flex flex-wrap gap-2">
                {extractedSkills.map((skill, index) => <span key={index} className="inline-block bg-accent text-primary text-sm px-3 py-1 rounded-full">
                    {skill}
                  </span>)}
              </div>
            </div>}

          {totalJobs > 0 && <div className="text-sm text-gray-600">
              Found {totalJobs} jobs matching your criteria
            </div>}

          <div className="grid gap-4">
            {isLoading ? <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div> : jobs.length === 0 ? <div className="text-center py-8 text-gray-500">
                {searchQuery.trim() ? "No jobs found. Try different keywords or filters." : "Start searching for jobs..."}
              </div> : jobs.map(job => <Card key={job.id} className="p-6 card-hover bg-white relative">
                  <Button variant="ghost" size="icon" className="absolute top-4 right-4 hover:bg-transparent" onClick={() => toggleSaveJob(job)}>
                    <Star className={`w-5 h-5 ${isJobSaved(job.id) ? "text-pink-500 fill-pink-500" : "text-gray-400 hover:text-pink-500"}`} />
                  </Button>
                  <div className="flex items-start pr-12">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">{job.headline}</h3>
                      <div className="flex items-center gap-2 text-gray-600">
                        <BriefcaseIcon className="w-4 h-4" />
                        <span>{job.employer?.name}</span>
                        {job.workplace?.city && <>
                            <span>•</span>
                            <span>{job.workplace.city}</span>
                          </>}
                      </div>
                      <div className="flex gap-2">
                        {job.working_hours_type?.label && <span className="inline-block bg-accent text-primary text-sm px-3 py-1 rounded-full">
                            {job.working_hours_type.label}
                          </span>}
                        {job.salary_type?.label && <span className="inline-block bg-secondary text-gray-600 text-sm px-3 py-1 rounded-full">
                            {job.salary_type.label}
                          </span>}
                      </div>
                    </div>
                    <Button onClick={() => {
                window.open(`${AF_BASE_URL}/${job.id}`, '_blank');
              }} className="ml-auto bg-primary hover:bg-primary-hover text-white">
                      Apply Now
                    </Button>
                  </div>
                </Card>)}
          </div>

          {totalPages > 1 && <Pagination className="my-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => handlePageChange(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : ""} />
                </PaginationItem>
                
                {renderPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>}
        </div>
      </div>
    </div>
  );
};

export default Search;
