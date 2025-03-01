import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from 'usehooks-ts';
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BriefcaseIcon, Star, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import type { JobListing } from "@/types/job";

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { toggleSaveJob, isJobSaved } = useSavedJobs();

  useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  useEffect(() => {
    setSearchParams(debouncedSearchTerm ? { q: debouncedSearchTerm } : {});
  }, [debouncedSearchTerm, setSearchParams]);

  const { isLoading, error, data } = useQuery({
    queryKey: ['search', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm) return [];

      const response = await fetch(
        `https://jobsearch.api.jobtechdev.se/search?q=${debouncedSearchTerm}&offset=0&limit=20`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const result = await response.json();
      return result.hits || [];
    },
  });

  const handleSaveJob = async (job: JobListing) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save jobs",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    await toggleSaveJob(job);
  };

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Job Search</h1>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/saved-jobs")}
              className="text-gray-600 hover:text-gray-900"
            >
              <Star className="w-4 h-4 mr-2" />
              Saved Jobs
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/tracker")}
              className="text-gray-600 hover:text-gray-900"
            >
              <BriefcaseIcon className="w-4 h-4 mr-2" />
              Jobs Tracker
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/cv-tailoring")}
              className="text-gray-600 hover:text-gray-900"
            >
              <FileText className="w-4 h-4 mr-2" />
              CV Tailoring
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search for jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}

        <div>
          {data?.map((job: JobListing) => (
            <Card key={job.id} className="mb-4 p-4 card-hover bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{job.headline}</h2>
                  <p className="text-gray-600">{job.employer.name}</p>
                  {job.workplace?.city && (
                    <p className="text-gray-500">{job.workplace.city}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => window.open(`${AF_BASE_URL}/${job.id}`, "_blank")}
                    className="bg-primary hover:bg-primary-hover text-white"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSaveJob(job)}
                    className={isJobSaved(job.id) ? "text-pink-500" : "text-gray-500"}
                  >
                    <Star className={isJobSaved(job.id) ? "w-5 h-5 fill-pink-500" : "w-5 h-5"} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search;
