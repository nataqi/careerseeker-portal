
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  BriefcaseIcon,
  SearchIcon,
  Loader2
} from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useNavigate } from "react-router-dom";

interface JobSelectorProps {
  onJobSelect: (jobId: string) => void;
  selectedJobId: string | null;
}

export const JobSelector = ({ onJobSelect, selectedJobId }: JobSelectorProps) => {
  const { savedJobs, isLoading } = useSavedJobs();
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const JOBS_PER_PAGE = 5;

  const totalPages = Math.ceil(savedJobs.length / JOBS_PER_PAGE);
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
  const displayedJobs = savedJobs.slice(startIndex, startIndex + JOBS_PER_PAGE);

  if (isLoading) {
    return (
      <Card className="p-6 flex items-center justify-center h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  if (savedJobs.length === 0) {
    return (
      <Card className="p-6 text-center h-[300px] flex flex-col items-center justify-center">
        <div className="text-gray-500 mb-4">No saved jobs yet</div>
        <Button onClick={() => navigate("/search")}>
          <SearchIcon className="w-4 h-4 mr-2" />
          Search Jobs
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Select a job to tailor your CV</h3>
      
      <div className="space-y-3">
        {displayedJobs.map((job) => (
          <Card 
            key={job.job_id} 
            className={`p-4 cursor-pointer hover:bg-secondary/50 transition-colors ${
              selectedJobId === job.job_id ? 'border-primary bg-secondary/70' : ''
            }`}
            onClick={() => onJobSelect(job.job_id)}
          >
            <div className="flex items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{job.headline}</h4>
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <BriefcaseIcon className="w-3.5 h-3.5" />
                  <span>{job.employer_name}</span>
                  {job.workplace_city && (
                    <>
                      <span>•</span>
                      <span>{job.workplace_city}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
};
