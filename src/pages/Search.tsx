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
  const [isUsingCVResults, setIsUsingCVResults] = useState(false);
  const [cvSearchQuery, setCVSearchQuery] = useState("");
  const offset = (currentPage - 1) * RESULTS_PER_PAGE;
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
  const handleFilterChange = (value: string) => {
    const filterValue = value as PublishDateFilter;
    setPublishDateFilter(filterValue);
    setCurrentPage(1);
    console.log(`[INFO] Filter changed to: ${filterValue || 'none'}, isUsingCVResults: ${isUsingCVResults}`);
  };
  useEffect(() => {
    const fetchJobs = async () => {
      const activeQuery = isUsingCVResults ? cvSearchQuery : debouncedSearchQuery;
      if (!activeQuery.trim()) {
        setJobs([]);
        setTotalJobs(0);
        return;
      }
      setIsLoading(true);
      try {
        console.log(`[INFO] Fetching jobs with: query=${activeQuery}, page=${currentPage}, filter=${publishDateFilter || 'none'}, isUsingCVResults=${isUsingCVResults}`);
        const {
          hits,
          total
        } = await searchJobs(activeQuery, offset, RESULTS_PER_PAGE, publishDateFilter, "OR");
        setJobs(hits);
        setTotalJobs(total.value);
        console.log(`[INFO] Fetched ${hits.length} jobs, total: ${total.value}`);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast({
          title: "Error",
          description: "Failed to fetch jobs. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [debouncedSearchQuery, cvSearchQuery, isUsingCVResults, publishDateFilter, currentPage, offset]);
  const handleProcessCV = async (file: File) => {
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
      setExtractedSkills(functionData.skills || []);
      setCVSearchQuery(functionData.skills.join(' '));
      setIsUsingCVResults(true);
      setCurrentPage(1);
      toast({
        title: "CV Processed",
        description: `Found ${functionData.totalJobs} matching jobs based on your CV.`
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
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsUsingCVResults(false);
    setCurrentPage(1);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleProcessCV(file);
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
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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
      // Always show first page
      items.push(<PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>);

      // Show ellipsis if current page is more than 3
      if (currentPage > 3) {
        items.push(<PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>);
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      for (let i = startPage; i <= endPage; i++) {
        items.push(<PaginationItem key={i}>
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
              {i}
            </PaginationLink>
          </PaginationItem>);
      }

      // Show ellipsis if current page is less than totalPages - 2
      if (currentPage < totalPages - 2) {
        items.push(<PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>);
      }

      // Always show last page
      items.push(<PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>);
    }
    return items;
  };
  if (!user) return null;
  return <div className="min-h-screen bg-secondary">
      <NavBar />
      
      <div className="bg-white border-b">
        <div className="max-w-[1200px] mx-auto px-4 py-12 text-center bg-yellow-50">
          <h1 className="text-3xl font-bold mb-2 mx-0 text-slate-900 md:text-4xl">Search Jobs</h1>
          <p className="max-w-2xl mx-auto text-slate-900">Find the perfect job opportunity by searching through thousands of positions posted on Arbetsförmedlingen</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="space-y-4">
          {/* Search Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input type="text" placeholder="Search jobs by title, company, or keywords..." value={searchQuery} onChange={handleSearchInput} className="pl-10 w-full" />
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
                <Button disabled={isLoading} className="text-slate-900 rounded-md bg-zinc-400 hover:bg-zinc-300">
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

            <div className="mt-4">
              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {isFiltersOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 p-4 border rounded-md">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Publishing Date</h3>
                      <RadioGroup value={publishDateFilter} onValueChange={handleFilterChange} className="flex flex-wrap gap-4">
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

          {/* CV Upload Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-semibold text-gray-900 whitespace-nowrap">Upload Your CV</h2>
              <div className="flex-1">
                <input type="file" accept=".pdf" onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleProcessCV(file);
              }} className="hidden" id="cv-upload" disabled={isProcessingCV} />
                <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} className={`relative border-2 ${isDragging ? 'border-primary bg-primary/10' : 'border-dashed border-gray-300'} rounded-lg p-3 transition-all cursor-pointer hover:border-primary/50`} onClick={() => document.getElementById('cv-upload')?.click()}>
                  {isProcessingCV ? <div className="flex items-center justify-center h-12 gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <p className="text-sm text-gray-600">Processing CV...</p>
                    </div> : <div className="flex items-center justify-center h-12 gap-3">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">
                        {isDragging ? "Drop your CV here" : "Drag and drop your CV here or click to select"}
                      </p>
                    </div>}
                </div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          {/* {extractedSkills.length > 0 && <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Skills Extracted from CV:</h3>
              <div className="flex flex-wrap gap-2">
                {extractedSkills.map((skill, index) => <span key={index} className="inline-block bg-accent text-primary text-sm px-3 py-1 rounded-full">
                    {skill}
                  </span>)}
              </div>
            </div>} */}

          {/* Jobs Count */}
          {totalJobs > 0 && <div className="text-sm text-gray-600">
              Found {totalJobs} jobs matching your criteria
            </div>}

          {/* Jobs Section */}
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

          {/* Pagination */}
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
    </div>;
};
export default Search;