
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Bookmark, BriefcaseIcon, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { useToast } from "@/hooks/use-toast";

const JOBS_PER_PAGE = 10;
const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";

const SavedJobs = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedJobs, isLoading, unsaveJob } = useSavedJobs();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleDeleteJob = async (jobId: string) => {
    if (confirm("Are you sure you want to remove this job from your saved list?")) {
      try {
        await unsaveJob(jobId);
        toast({
          title: "Job removed",
          description: "The job has been removed from your saved list",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to remove the job. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const totalPages = Math.ceil(savedJobs.length / JOBS_PER_PAGE);
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
  const displayedJobs = savedJobs.slice(startIndex, startIndex + JOBS_PER_PAGE);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary">
      <NavBar />
      
      <div className="hero-shine">
        <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Saved Jobs</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            View and manage your saved job listings in one place
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Bookmark className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No saved jobs yet</h2>
            <p className="text-gray-600 mb-6">
              Start saving jobs you're interested in to view them here later
            </p>
            <Button onClick={() => navigate("/search")} className="bg-primary hover:bg-primary-hover text-white">
              Search Jobs
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Your Saved Jobs</h2>
                <span className="text-sm text-gray-600">
                  {savedJobs.length} {savedJobs.length === 1 ? "job" : "jobs"} saved
                </span>
              </div>
              
              <div className="space-y-3">
                {displayedJobs.map((job) => (
                  <Card key={job.id} className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900">
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
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`${AF_BASE_URL}/${job.job_id}`, '_blank')}
                          className="whitespace-nowrap"
                        >
                          View Job
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 p-0 ${currentPage === page ? 'bg-primary text-white' : ''}`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
