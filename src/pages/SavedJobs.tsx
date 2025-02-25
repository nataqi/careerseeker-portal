import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BriefcaseIcon, ArrowLeft, Home, Loader2, Star } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";
const SavedJobs = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    savedJobs,
    isLoading
  } = useSavedJobs();
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);
  if (!user) return null;
  return <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-gray-600 hover:text-gray-900">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Saved Jobs</h1>
        </div>

        <div className="space-y-4">
          {isLoading ? <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div> : savedJobs.length === 0 ? <div className="text-center py-8">
              <div className="text-gray-500">No saved jobs yet</div>
              <Button className="mt-4" onClick={() => navigate("/search")}>
                Search Jobs
              </Button>
            </div> : savedJobs.map(job => <Card key={job.id} className="p-6 card-hover bg-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {job.headline}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <BriefcaseIcon className="w-4 h-4" />
                      <span>{job.employer_name}</span>
                      {job.workplace_city && <>
                          <span>•</span>
                          <span>{job.workplace_city}</span>
                        </>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => window.open(`${AF_BASE_URL}/${job.job_id}`, '_blank')} className="bg-primary hover:bg-primary-hover text-white">Apply </Button>
                    <Star className="w-5 h-5 text-pink-500 fill-pink-500" />
                  </div>
                </div>
              </Card>)}
        </div>
      </div>
    </div>;
};
export default SavedJobs;