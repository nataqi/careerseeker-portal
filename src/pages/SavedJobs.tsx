import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BriefcaseIcon, Loader2, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { NavBar } from "@/components/NavBar";

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";
const JOBS_PER_PAGE = 10;

const SavedJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedJobs, isLoading, toggleSaveJob } = useSavedJobs();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) return null;

  const totalPages = Math.ceil(savedJobs.length / JOBS_PER_PAGE);
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
  const displayedJobs = savedJobs.slice(startIndex, startIndex + JOBS_PER_PAGE);

  const handleUnsaveJob = async (jobId: string) => {
    const job = savedJobs.find(j => j.job_id === jobId);
    if (job) {
      await toggleSaveJob({
        id: job.job_id,
        headline: job.headline,
        employer: { name: job.employer_name },
        workplace: { city: job.workplace_city || undefined }
      } as any);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <NavBar />
      
      <div className="bg-hero-gradient">
        <div className="max-w-[1200px] mx-auto px-4 py-1 md:py-2 text-center relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Saved Jobs</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            View and manage all the jobs you've saved for later application
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
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
                <Card key={job.id} className="p-6 card-hover bg-white">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {job.headline}
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
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() =>
                          window.open(`${AF_BASE_URL}/${job.job_id}`, "_blank")
                        }
                        className="bg-primary hover:bg-primary-hover text-white"
                      >
                        Apply
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnsaveJob(job.job_id)}
                        className="text-pink-500"
                      >
                        <Star className="w-5 h-5 fill-pink-500" />
                      </Button>
                    </div>
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
    </div>
  );
};

export default SavedJobs;
