
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BriefcaseIcon, ArrowLeft, Home, Loader2, ArrowRight } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { SavedJob } from "@/types/saved-job";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";

const APPLICATION_STATUSES = [
  { value: "Applied", label: "Applied" },
  { value: "Declined", label: "Declined" },
  { value: "Awaiting", label: "Awaiting" },
  { value: "Offer", label: "Offer" },
] as const;

const Tracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedJobs, isLoading } = useSavedJobs();
  const [trackedJobs, setTrackedJobs] = useState<SavedJob[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    if (result.source.droppableId === "savedJobs" && result.destination.droppableId === "tracker") {
      const draggedJob = savedJobs[sourceIndex];
      if (!trackedJobs.some(job => job.id === draggedJob.id)) {
        setTrackedJobs(prev => [...prev, draggedJob]);
      }
    }
  };

  const handleStatusChange = (jobId: string, status: string) => {
    setTrackedJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, response_status: status } : job
      )
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="container mx-auto max-w-[90rem]">
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
              onClick={() => navigate("/")}
              className="text-gray-600 hover:text-gray-900"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Job Tracking</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3 md:col-span-1">
                <h2 className="text-xl font-semibold mb-4">Saved Jobs</h2>
                <Droppable droppableId="savedJobs">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {savedJobs.map((job, index) => (
                        <Draggable key={job.id} draggableId={job.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 card-hover bg-white ${
                                snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 flex-1">
                                  <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">
                                    {job.headline}
                                  </h3>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <BriefcaseIcon className="w-3 h-3" />
                                    <span className="line-clamp-1">{job.employer_name}</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => window.open(`${AF_BASE_URL}/${job.job_id}`, '_blank')}
                                  className="bg-primary hover:bg-primary-hover text-white shrink-0 h-7 text-xs px-2"
                                >
                                  Apply
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <div className="bg-white rounded-lg p-6 border md:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Job Tracker</h2>
                <Droppable droppableId="tracker">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="min-h-[400px] border rounded-lg"
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Employer</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trackedJobs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-gray-500 h-[300px]">
                                Drag jobs here to track them
                              </TableCell>
                            </TableRow>
                          ) : (
                            trackedJobs.map((job) => (
                              <TableRow key={job.id}>
                                <TableCell className="font-medium">{job.headline}</TableCell>
                                <TableCell>{job.employer_name}</TableCell>
                                <TableCell>{job.workplace_city || '-'}</TableCell>
                                <TableCell>
                                  <Select
                                    value={job.response_status || "Awaiting"}
                                    onValueChange={(value) => handleStatusChange(job.id, value)}
                                  >
                                    <SelectTrigger className="w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {APPLICATION_STATUSES.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                          {status.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

export default Tracker;
