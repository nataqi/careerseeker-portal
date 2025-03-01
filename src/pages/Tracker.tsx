import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BriefcaseIcon, ArrowLeft, Home, Loader2, Star, Search, FileText } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SavedJob } from "@/types/saved-job";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";

const Tracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedJobs, isLoading, updateJobStatus } = useSavedJobs();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleStatusChange = async (jobId: string, status: SavedJob['response_status']) => {
    await updateJobStatus(jobId, status);
    setSelectedJobId(null);
  };

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/search")}
              className="text-gray-600 hover:text-gray-900"
            >
              <Home className="w-4 h-4 mr-2" />
              Search
            </Button>
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
              onClick={() => navigate("/cv-tailoring")}
              className="text-gray-600 hover:text-gray-900"
            >
              <FileText className="w-4 h-4 mr-2" />
              CV Tailoring
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Jobs Tracker</h1>
        </div>

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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Job Title</TableHead>
                  <TableHead>Employer</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.headline}</TableCell>
                    <TableCell>{job.employer_name}</TableCell>
                    <TableCell>{job.workplace_city || 'N/A'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="outline" size="sm">
                            {job.response_status || 'Not Applied'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'Not Applied')}>
                            Not Applied
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'Applied')}>
                            Applied
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'No Response')}>
                            No Response
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'Rejected')}>
                            Rejected
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'Interview Scheduled')}>
                            Interview Scheduled
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'Offer Received')}>
                            Offer Received
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'Offer Accepted')}>
                            Offer Accepted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'Offer Declined')}>
                            Offer Declined
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracker;
