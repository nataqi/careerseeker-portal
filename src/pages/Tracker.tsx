import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BriefcaseIcon, ArrowLeft, Home, Loader2, Trash2, ChevronLeft, ChevronRight, Edit, Save, X, BookmarkIcon } from "lucide-react";
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
const JOBS_PER_PAGE = 10;

const APPLICATION_STATUSES = [
  { value: "Not Applied", label: "Not Applied" },
  { value: "Applied", label: "Applied" },
  { value: "No Response", label: "No Response" },
  { value: "Rejected", label: "Rejected" },
  { value: "Interview Scheduled", label: "Interview Scheduled" },
  { value: "Offer Received", label: "Offer Received" },
  { value: "Offer Accepted", label: "Offer Accepted" },
  { value: "Offer Declined", label: "Offer Declined" } as const,
] as const;

type ApplicationStatus = typeof APPLICATION_STATUSES[number]['value'];

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '.');
};

const Tracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedJobs, isLoading, updateJobStatus } = useSavedJobs();
  const [trackedJobs, setTrackedJobs] = useState<SavedJob[]>([]);
  const [availableJobs, setAvailableJobs] = useState<SavedJob[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SavedJob>>({});

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (savedJobs) {
      setAvailableJobs(savedJobs.filter(job => !trackedJobs.some(tracked => tracked.id === job.id)));
    }
  }, [savedJobs, trackedJobs]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === "savedJobs" && destination.droppableId === "trackerTable") {
      const draggedJob = availableJobs[source.index];
      if (!trackedJobs.some(job => job.id === draggedJob.id)) {
        const currentDate = formatDate(new Date());
        setTrackedJobs(prev => {
          const newJobs = [...prev, {
            ...draggedJob,
            workplace_city: draggedJob.workplace_city || 'Not specified',
            notes: null,
            tracking_date: currentDate
          }];
          return newJobs.sort((a, b) => {
            if (a.tracking_date === b.tracking_date) {
              return a.headline.localeCompare(b.headline);
            }
            return (b.tracking_date || '').localeCompare(a.tracking_date || '');
          });
        });
        setAvailableJobs(prev => prev.filter(job => job.id !== draggedJob.id));
      }
    }
  };

  const handleEditClick = (job: SavedJob) => {
    setEditingJob(job.id);
    setEditForm(job);
  };

  const handleSaveEdit = async (jobId: string) => {
    setTrackedJobs(prev => {
      const updatedJobs = prev.map(job =>
        job.id === jobId ? { ...job, ...editForm } : job
      );
      return updatedJobs.sort((a, b) => {
        if (a.tracking_date === b.tracking_date) {
          return a.headline.localeCompare(b.headline);
        }
        return (b.tracking_date || '').localeCompare(a.tracking_date || '');
      });
    });
    setEditingJob(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
    setEditForm({});
  };

  const handleStatusChange = async (jobId: string, status: ApplicationStatus) => {
    setTrackedJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, response_status: status } : job
      )
    );
    
    await updateJobStatus(jobId, status);
  };

  const handleRemoveJob = (jobId: string) => {
    const jobToRemove = trackedJobs.find(job => job.id === jobId);
    if (jobToRemove) {
      setTrackedJobs(prev => prev.filter(job => job.id !== jobId));
      setAvailableJobs(prev => [...prev, jobToRemove]);
    }
  };

  const totalPages = Math.ceil(availableJobs.length / JOBS_PER_PAGE);
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
  const endIndex = startIndex + JOBS_PER_PAGE;
  const currentJobs = availableJobs.slice(startIndex, endIndex);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="bg-white border-b">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between py-4 border-b">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-gray-600 hover:text-gray-900"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/saved-jobs")}
                className="text-gray-600 hover:text-gray-900"
              >
                <BookmarkIcon className="w-4 h-4 mr-2" />
                Saved Jobs
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Create Excel data
                  const data = trackedJobs.map(job => ({
                    'Job Title': `=HYPERLINK("https://arbetsformedlingen.se/platsbanken/annonser/${job.job_id}", "${job.headline}")`,
                    'Employer': job.employer_name,
                    'Location': job.workplace_city || '',
                    'Status': job.response_status,
                    'Date': job.tracking_date,
                    'Notes': job.notes || ''
                  }));

                  // Convert to CSV
                  const headers = ['Job Title', 'Employer', 'Location', 'Status', 'Date', 'Notes'];
                  const csvContent = [
                    headers.join(','),
                    ...data.map(row => 
                      headers.map(header => 
                        `"${String(row[header as keyof typeof row]).replace(/"/g, '""')}"`
                      ).join(',')
                    )
                  ].join('\n');

                  // Create and download file
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'job_tracker.csv';
                  link.click();
                  URL.revokeObjectURL(link.href);
                }}
              >
                Export to CSV
              </Button>
            </div>
          </div>
          <div className="text-center py-16 space-y-4">
            <h1 className="text-5xl font-bold text-gray-900">
              Track Your Job Applications
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Manage your saved jobs and keep track of your applications in one place.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-12 gap-6 items-start">
              <div className="col-span-12 md:col-span-3 xl:col-span-2">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Saved Jobs</h2>
                  <Droppable droppableId="savedJobs">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {currentJobs.map((job, index) => (
                          <Draggable key={job.id} draggableId={job.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-4 ${
                                  snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                                }`}
                              >
                                <div className="space-y-2">
                                  <h3 className="font-medium text-sm leading-tight break-words">
                                    <a
                                      href={`https://arbetsformedlingen.se/platsbanken/annonser/${job.job_id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {job.headline}
                                    </a>
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 min-w-0 flex-1">
                                      <BriefcaseIcon className="w-3 h-3 shrink-0" />
                                      <span className="break-words">{job.employer_name}</span>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => window.open(`${AF_BASE_URL}/${job.job_id}`, '_blank')}
                                      className="bg-primary hover:bg-primary-hover text-white shrink-0 h-7 text-xs px-2.5"
                                    >
                                      Apply
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-12 md:col-span-9 xl:col-span-10">
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Job Title</TableHead>
                          <TableHead className="min-w-[180px]">Employer</TableHead>
                          <TableHead className="min-w-[120px]">Location</TableHead>
                          <TableHead className="min-w-[150px]">Status</TableHead>
                          <TableHead className="min-w-[100px]">Date</TableHead>
                          <TableHead className="min-w-[200px]">Notes</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <Droppable droppableId="trackerTable">
                        {(provided) => (
                          <TableBody
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="min-h-[400px] relative"
                          >
                            {trackedJobs.length === 0 ? (
                              <TableRow>
                                <TableCell 
                                  colSpan={7} 
                                  className="text-center text-gray-500 h-[300px]"
                                >
                                  Drag jobs here to track them
                                </TableCell>
                              </TableRow>
                            ) : (
                              trackedJobs.map((job, index) => (
                                <Draggable
                                  key={job.id}
                                  draggableId={job.id}
                                  index={index}
                                >
                                  {(provided) => (
                                    <TableRow
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      <TableCell className="font-medium">
                                        {editingJob === job.id ? (
                                          <Input
                                            value={editForm.headline || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, headline: e.target.value }))}
                                          />
                                        ) : (
                                          job.headline
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {editingJob === job.id ? (
                                          <Input
                                            value={editForm.employer_name || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, employer_name: e.target.value }))}
                                          />
                                        ) : (
                                          job.employer_name
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {editingJob === job.id ? (
                                          <Input
                                            value={editForm.workplace_city || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, workplace_city: e.target.value }))}
                                          />
                                        ) : (
                                          job.workplace_city
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          defaultValue={job.response_status || "Not Applied"}
                                          onValueChange={(value) => handleStatusChange(job.id, value as ApplicationStatus)}
                                          disabled={editingJob !== job.id}
                                        >
                                          <SelectTrigger className="w-[150px]">
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
                                      <TableCell>
                                        {editingJob === job.id ? (
                                          <Input
                                            value={editForm.tracking_date || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, tracking_date: e.target.value }))}
                                            placeholder="DD.MM.YY"
                                          />
                                        ) : (
                                          job.tracking_date
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {editingJob === job.id ? (
                                          <Textarea
                                            value={editForm.notes || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                            className="min-h-[80px]"
                                          />
                                        ) : (
                                          <div className="max-h-[80px] overflow-hidden text-sm">
                                            {job.notes ? (
                                              job.notes.length > 50 ? 
                                                `${job.notes.slice(0, 50)}...` : 
                                                job.notes
                                            ) : '-'}
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          {editingJob === job.id ? (
                                            <>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleSaveEdit(job.id)}
                                                className="h-8 w-8 text-gray-500 hover:text-green-600"
                                              >
                                                <Save className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleCancelEdit}
                                                className="h-8 w-8 text-gray-500 hover:text-red-600"
                                              >
                                                <X className="h-4 w-4" />
                                              </Button>
                                            </>
                                          ) : (
                                            <>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveJob(job.id)}
                                                className="h-8 w-8 text-gray-500 hover:text-red-600"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(job)}
                                                className="h-8 w-8 text-gray-500 hover:text-primary"
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Draggable>
                              ))
                            )}
                            {provided.placeholder}
                          </TableBody>
                        )}
                      </Droppable>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

export default Tracker;
