import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BriefcaseIcon, ArrowLeft, Home, Loader2, Trash2, ExternalLink } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";

const SavedJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedJobs, isLoading, removeJob } = useSavedJobs();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleRemoveJob = async (jobId: string) => {
    await removeJob(jobId);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary">
      <NavBar />
      
      <div className="bg-white border-b">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="text-center py-16 space-y-4">
            <h1 className="text-5xl font-bold text-gray-900">
              Saved Jobs
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              View and manage your saved job listings.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-[1200px] px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No saved jobs yet.</p>
            <Button onClick={() => navigate("/search")} className="mt-4">
              Find Jobs
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedJobs.map((job) => (
              <Card key={job.id} className="bg-white p-4 shadow-sm card-hover">
                <div className="flex flex-col h-full">
                  <div className="space-y-2 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
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
                      <BriefcaseIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{job.employer_name}</span>
                      {job.workplace_city && (
                        <>
                          <span>•</span>
                          <span>{job.workplace_city}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`${AF_BASE_URL}/${job.job_id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveJob(job.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
