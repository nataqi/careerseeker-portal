import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Home, Loader2, BriefcaseIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useJobTracking } from "@/hooks/useJobTracking";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useExportJobsToCSV } from "@/hooks/useExportJobsToCSV";
import { SavedJob } from "@/types/job";

const Tracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { trackedJobs, isLoading, updateJobStatus, updateJobNotes } = useJobTracking();
  const { toast } = useToast();
  const { exportJobsToCSV } = useExportJobsToCSV();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportJobsToCSV();
      toast({
        title: "Export Successful",
        description: "Your job tracking data has been exported to a CSV file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
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
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Job Tracker</h1>
        </div>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={handleExport}
              disabled={isLoading || isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export to CSV"
              )}
            </Button>
          </div>

          <Table>
            <TableCaption>A list of your tracked job applications.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Job Title</TableHead>
                <TableHead>Employer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tracking Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : trackedJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No jobs being tracked yet.
                  </td>
                </tr>
              ) : (
                trackedJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-4 py-2">
                      <a
                        href={`https://arbetsformedlingen.se/platsbanken/annonser/${job.job_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {job.headline}
                      </a>
                    </td>
                    <td className="px-4 py-2">{job.employer_name}</td>
                    <td className="px-4 py-2">{job.workplace_city || "-"}</td>
                    <td className="px-4 py-2">
                      <Select
                        value={job.response_status}
                        onValueChange={(value) =>
                          updateJobStatus(job.id, value as SavedJob["response_status"])
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APPLIED">Applied</SelectItem>
                          <SelectItem value="INTERVIEWING">Interviewing</SelectItem>
                          <SelectItem value="OFFER_RECEIVED">Offer Received</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2">{job.tracking_date}</td>
                    <td className="px-4 py-2">
                      <Input
                        type="text"
                        placeholder="Add notes"
                        value={job.notes || ""}
                        onChange={(e) => updateJobNotes(job.id, e.target.value)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Tracker;
