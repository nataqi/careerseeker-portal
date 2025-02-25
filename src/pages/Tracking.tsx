
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Edit2,
  Home,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import type { SavedJob, ApplicationStatus } from "@/types/saved-job";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "Not Applied",
  "Applied",
  "No Response",
  "Rejected",
  "Interview Scheduled",
  "Offer Received",
  "Offer Accepted",
  "Offer Declined",
];

const Tracking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedJobs, isLoading, updateJobApplication } = useSavedJobs();
  const [editingState, setEditingState] = useState<Record<string, boolean>>({});
  const [trackedJobs, setTrackedJobs] = useState<SavedJob[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    // Initialize tracked jobs with jobs that have response status other than "Not Applied"
    setTrackedJobs(savedJobs.filter(job => job.response_status !== "Not Applied"));
  }, [savedJobs]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceDroppableId = result.source.droppableId;
    const destinationDroppableId = result.destination.droppableId;

    if (sourceDroppableId === "saved-jobs" && destinationDroppableId === "tracked-jobs") {
      const draggedJob = savedJobs[result.source.index];
      if (!trackedJobs.some(job => job.id === draggedJob.id)) {
        updateJobApplication(draggedJob.id, {
          response_status: "Applied",
          application_date: new Date().toISOString(),
        });
      }
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "Applied":
        return "text-blue-600";
      case "Interview Scheduled":
        return "text-purple-600";
      case "Offer Received":
        return "text-orange-600";
      case "Offer Accepted":
        return "text-green-600";
      case "Rejected":
        return "text-red-600";
      case "Offer Declined":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const toggleEdit = (jobId: string) => {
    setEditingState(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const handleUpdate = async (jobId: string, updates: Partial<SavedJob>) => {
    await updateJobApplication(jobId, updates);
    toggleEdit(jobId);
  };

  const removeFromTracking = async (jobId: string) => {
    await updateJobApplication(jobId, {
      response_status: "Not Applied",
      application_date: null,
      interview_date: null,
      notes: null,
    });
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
          <h1 className="text-2xl font-semibold text-gray-900">Application Tracking</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Saved Jobs Column */}
              <Card className="bg-white p-6">
                <h2 className="text-xl font-semibold mb-4">Saved Jobs</h2>
                <Droppable droppableId="saved-jobs">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      <div className="space-y-4">
                        {savedJobs
                          .filter(job => job.response_status === "Not Applied")
                          .map((job, index) => (
                            <Draggable key={job.id} draggableId={job.id} index={index}>
                              {(provided) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="p-4 hover:bg-gray-50"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-medium">{job.headline}</h3>
                                      <p className="text-sm text-gray-600">{job.employer_name}</p>
                                      <p className="text-sm text-gray-500">{job.workplace_city || "-"}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => window.open(`${AF_BASE_URL}/${job.job_id}`, '_blank')}
                                    >
                                      <Star className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </Card>

              {/* Tracking Board Column */}
              <Card className="bg-white p-6">
                <h2 className="text-xl font-semibold mb-4">Application Tracker</h2>
                <Droppable droppableId="tracked-jobs">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Job Details</TableHead>
                            <TableHead>Application Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Interview Date</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-20">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trackedJobs.map((job, index) => (
                            <Draggable key={job.id} draggableId={`tracker-${job.id}`} index={index}>
                              {(provided) => (
                                <TableRow
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="hover:bg-gray-50"
                                >
                                  <TableCell>
                                    <div className="font-medium">{job.headline}</div>
                                    <div className="text-sm text-gray-600">{job.employer_name}</div>
                                    <div className="text-sm text-gray-500">{job.workplace_city || "-"}</div>
                                  </TableCell>
                                  <TableCell>
                                    {editingState[job.id] ? (
                                      <Input
                                        type="date"
                                        defaultValue={job.application_date?.split('T')[0] || ''}
                                        onChange={(e) => handleUpdate(job.id, {
                                          application_date: e.target.value ? new Date(e.target.value).toISOString() : null
                                        })}
                                        className="w-36"
                                      />
                                    ) : (
                                      <span>
                                        {job.application_date
                                          ? new Date(job.application_date).toLocaleDateString()
                                          : "-"}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {editingState[job.id] ? (
                                      <Select
                                        defaultValue={job.response_status}
                                        onValueChange={(value) =>
                                          handleUpdate(job.id, {
                                            response_status: value as ApplicationStatus
                                          })
                                        }
                                      >
                                        <SelectTrigger className="w-[180px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {STATUS_OPTIONS.map((status) => (
                                            <SelectItem key={status} value={status}>
                                              {status}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <span className={getStatusColor(job.response_status)}>
                                        {job.response_status}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {editingState[job.id] ? (
                                      <Input
                                        type="date"
                                        defaultValue={job.interview_date?.split('T')[0] || ''}
                                        onChange={(e) => handleUpdate(job.id, {
                                          interview_date: e.target.value ? new Date(e.target.value).toISOString() : null
                                        })}
                                        className="w-36"
                                      />
                                    ) : (
                                      <span>
                                        {job.interview_date
                                          ? new Date(job.interview_date).toLocaleDateString()
                                          : "-"}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {editingState[job.id] ? (
                                      <Input
                                        defaultValue={job.notes || ''}
                                        onChange={(e) => handleUpdate(job.id, {
                                          notes: e.target.value
                                        })}
                                        placeholder="Add notes..."
                                      />
                                    ) : (
                                      <span className="truncate max-w-[200px]">
                                        {job.notes || "-"}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleEdit(job.id)}
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFromTracking(job.id)}
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Droppable>
              </Card>
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

export default Tracking;
