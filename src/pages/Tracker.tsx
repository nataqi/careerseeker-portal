import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BriefcaseIcon, Loader2, Trash2, ChevronLeft, ChevronRight, Edit, Save, X, Download, Calendar as CalendarIcon } from "lucide-react";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { SavedJob, TRACKED_JOBS_STORAGE_KEY } from "@/types/saved-job";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NavBar } from "@/components/NavBar";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const AF_BASE_URL = "https://arbetsformedlingen.se/platsbanken/annonser";
const JOBS_PER_PAGE = 10;
const APPLICATION_STATUSES = [{
  value: "Not Applied",
  label: "Not Applied"
}, {
  value: "Applied",
  label: "Applied"
}, {
  value: "No Response",
  label: "No Response"
}, {
  value: "Rejected",
  label: "Rejected"
}, {
  value: "Interview Scheduled",
  label: "Interview Scheduled"
}, {
  value: "Offer Received",
  label: "Offer Received"
}, {
  value: "Offer Accepted",
  label: "Offer Accepted"
}, {
  value: "Offer Declined",
  label: "Offer Declined"
} as const] as const;

type ApplicationStatus = typeof APPLICATION_STATUSES[number]['value'];

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '.');
};

const parseDate = (dateString: string | null): Date | undefined => {
  if (!dateString) return undefined;
  
  const parts = dateString.split('.');
  if (parts.length !== 3) return undefined;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
  const year = parseInt(`20${parts[2]}`, 10); // Assume 20xx for years
  
  const date = new Date(year, month, day);
  
  // Validate the date is real
  if (isNaN(date.getTime())) return undefined;
  
  return date;
};

const saveTrackedJobsToLocalStorage = (userId: string, jobs: SavedJob[]) => {
  const storageKey = `tracked_jobs_${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(jobs));
  console.log(`Saved ${jobs.length} tracked jobs to local storage for user ${userId}`);
};

const loadTrackedJobsFromLocalStorage = (userId: string): SavedJob[] => {
  const storageKey = `tracked_jobs_${userId}`;
  const savedData = localStorage.getItem(storageKey);
  if (savedData) {
    const jobs = JSON.parse(savedData) as SavedJob[];
    console.log(`Loaded ${jobs.length} tracked jobs from local storage for user ${userId}`);
    return jobs;
  }
  return [];
};

const Tracker = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    savedJobs,
    isLoading
  } = useSavedJobs();
  const [trackedJobs, setTrackedJobs] = useState<SavedJob[]>([]);
  const [availableJobs, setAvailableJobs] = useState<SavedJob[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SavedJob>>({});
  const {
    toast
  } = useToast();

  useEffect(() => {
    if (user) {
      const loadedJobs = loadTrackedJobsFromLocalStorage(user.id);
      setTrackedJobs(loadedJobs);
    }
  }, [user]);

  useEffect(() => {
    if (user && trackedJobs.length > 0) {
      saveTrackedJobsToLocalStorage(user.id, trackedJobs);
    }
  }, [trackedJobs, user]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (savedJobs && trackedJobs) {
      const trackedJobIds = trackedJobs.map(job => job.id);
      setAvailableJobs(savedJobs.filter(job => !trackedJobIds.includes(job.id)));
    }
  }, [savedJobs, trackedJobs]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const {
      source,
      destination
    } = result;

    console.log('Drag end:', { source, destination });

    if (source.droppableId === "savedJobs" && destination.droppableId === "trackerTable") {
      const draggedJob = availableJobs[source.index];
      console.log('Dragged job:', draggedJob);
      
      if (!trackedJobs.some(job => job.id === draggedJob.id)) {
        const currentDate = formatDate(new Date());
        const updatedTrackedJobs = [...trackedJobs, {
          ...draggedJob,
          workplace_city: draggedJob.workplace_city || 'Not specified',
          notes: null,
          tracking_date: currentDate
        }];
        
        const sortedJobs = updatedTrackedJobs.sort((a, b) => {
          if (a.tracking_date === b.tracking_date) {
            return a.headline.localeCompare(b.headline);
          }
          return (b.tracking_date || '').localeCompare(a.tracking_date || '');
        });
        
        setTrackedJobs(sortedJobs);
        
        setAvailableJobs(prev => prev.filter(job => job.id !== draggedJob.id));
        
        toast({
          title: "Job tracked",
          description: `Added "${draggedJob.headline}" to tracked jobs`
        });
      }
    }
  };

  const handleEditClick = (job: SavedJob) => {
    setEditingJob(job.id);
    setEditForm(job);
  };

  const handleSaveEdit = async (jobId: string) => {
    setTrackedJobs(prev => {
      const updatedJobs = prev.map(job => job.id === jobId ? {
        ...job,
        ...editForm
      } : job);
      
      return updatedJobs.sort((a, b) => {
        if (a.tracking_date === b.tracking_date) {
          return a.headline.localeCompare(b.headline);
        }
        return (b.tracking_date || '').localeCompare(a.tracking_date || '');
      });
    });
    
    setEditingJob(null);
    setEditForm({});
    
    toast({
      title: "Job updated",
      description: "Changes saved successfully"
    });
  };

  const handleCancelEdit = () => {
    setEditingJob(null);
    setEditForm({});
  };

  const handleStatusChange = async (jobId: string, status: ApplicationStatus) => {
    setTrackedJobs(prev => prev.map(job => job.id === jobId ? {
      ...job,
      response_status: status
    } : job));
    
    toast({
      title: "Status updated",
      description: `Job status changed to ${status}`
    });
  };

  const handleRemoveJob = (jobId: string) => {
    const jobToRemove = trackedJobs.find(job => job.id === jobId);
    if (jobToRemove) {
      setTrackedJobs(prev => prev.filter(job => job.id !== jobId));
      setAvailableJobs(prev => [...prev, jobToRemove].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      
      toast({
        title: "Job removed",
        description: "Job removed from tracking"
      });
    }
  };

  const handleExportCSV = () => {
    if (trackedJobs.length === 0) {
      toast({
        title: "No jobs to export",
        description: "Add jobs to your tracker first before exporting.",
        variant: "destructive"
      });
      return;
    }
    
    const headers = ["Job Title", "Job URL", "Employer", "Location", "Status", "Date", "Notes"];
    const csvRows = [headers];
    trackedJobs.forEach(job => {
      const jobUrl = `${AF_BASE_URL}/${job.job_id}`;
      const row = [job.headline, jobUrl, job.employer_name, job.workplace_city || "Not specified", job.response_status || "Not Applied", job.tracking_date || "", job.notes || ""];
      const escapedRow = row.map(field => {
        const escaped = field.toString().replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(escapedRow);
    });
    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `job-applications-${formatDate(new Date()).replace(/\./g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Export successful",
      description: `Exported ${trackedJobs.length} job applications to CSV`
    });
  };

  const handleDateSelect = (date: Date | undefined, jobId: string) => {
    if (!date) return;
    
    const formattedDate = formatDate(date);
    
    setEditForm(prev => ({
      ...prev,
      tracking_date: formattedDate
    }));
    
    // If not in edit mode, update the job directly
    if (editingJob !== jobId) {
      setTrackedJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, tracking_date: formattedDate } 
          : job
      ));
      
      toast({
        title: "Date updated",
        description: `Tracking date set to ${formattedDate}`
      });
    }
  };

  const totalPages = Math.ceil(availableJobs.length / JOBS_PER_PAGE);
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
  const endIndex = startIndex + JOBS_PER_PAGE;
  const currentJobs = availableJobs.slice(startIndex, endIndex);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="sticky top-0 z-50">
        <NavBar />
        
        <div className="bg-gradient-to-br from-custom-green-1 to-custom-green-2 sticky top-0 z-50">
          <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Application Tracker</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Track the status of your job applications in one place. Just Drag and drop
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {isLoading ? <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div> : <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-12 gap-6 items-start">
              <div className="col-span-12 md:col-span-4 xl:col-span-3">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Saved Jobs</h2>
                  <Droppable droppableId="savedJobs">
                    {provided => <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {currentJobs.map((job, index) => <Draggable key={job.id} draggableId={job.id} index={index}>
                            {(provided, snapshot) => <Card ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`p-4 ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}>
                                <div className="space-y-2">
                                  <h3 className="text-base font-semibold text-primary leading-tight break-words hover:underline cursor-pointer" onClick={() => window.open(`${AF_BASE_URL}/${job.job_id}`, '_blank')}>
                                    {job.headline}
                                  </h3>
                                  <div className="flex items-center gap-1.5 text-sm text-gray-600 min-w-0">
                                    <BriefcaseIcon className="w-4 h-4 shrink-0" />
                                    <span className="break-words">{job.employer_name}</span>
                                  </div>
                                </div>
                              </Card>}
                          </Draggable>)}
                        {provided.placeholder}
                      </div>}
                  </Droppable>
                  {totalPages > 1 && <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <Button variant="ghost" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-600">
                        {currentPage} / {totalPages}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>}
                </div>
              </div>

              <div className="col-span-12 md:col-span-8 xl:col-span-9">
                <div className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Tracked Applications</h2>
                    <Button onClick={handleExportCSV} variant="outline" size="sm" className="bg-white text-primary border-primary hover:bg-primary/5">
                      <Download className="w-4 h-4 mr-2" />
                      Export to CSV
                    </Button>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-[1100px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[220px]">Job Title</TableHead>
                            <TableHead className="w-[180px]">Employer</TableHead>
                            <TableHead className="w-[130px]">Location</TableHead>
                            <TableHead className="w-[150px]">Status</TableHead>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead className="w-[220px]">Notes</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <Droppable droppableId="trackerTable">
                          {provided => <TableBody {...provided.droppableProps} ref={provided.innerRef} className="min-h-[400px] relative">
                              {trackedJobs.length === 0 ? <TableRow>
                                  <TableCell colSpan={7} className="text-center text-gray-500 h-[300px]">
                                    Drag jobs here to track them
                                  </TableCell>
                                </TableRow> : trackedJobs.map((job, index) => <Draggable key={job.id} draggableId={job.id} index={index}>
                                    {provided => <TableRow ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                        <TableCell className="font-medium">
                                          {editingJob === job.id ? <Input value={editForm.headline || ''} onChange={e => setEditForm(prev => ({
                                ...prev,
                                headline: e.target.value
                              }))} /> : <a href={`${AF_BASE_URL}/${job.job_id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                              {job.headline}
                                            </a>}
                                        </TableCell>
                                        <TableCell>
                                          {editingJob === job.id ? <Input value={editForm.employer_name || ''} onChange={e => setEditForm(prev => ({
                                ...prev,
                                employer_name: e.target.value
                              }))} /> : job.employer_name}
                                        </TableCell>
                                        <TableCell>
                                          {editingJob === job.id ? <Input value={editForm.workplace_city || ''} onChange={e => setEditForm(prev => ({
                                ...prev,
                                workplace_city: e.target.value
                              }))} /> : job.workplace_city}
                                        </TableCell>
                                        <TableCell>
                                          <Select 
                                            defaultValue={job.response_status || "Not Applied"} 
                                            onValueChange={value => handleStatusChange(job.id, value as ApplicationStatus)} 
                                            disabled={editingJob !== job.id}>
                                            <SelectTrigger className="w-[150px] bg-white">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {APPLICATION_STATUSES.map(status => (
                                                <SelectItem key={status.value} value={status.value}>
                                                  {status.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </TableCell>
                                        <TableCell>
                                          {editingJob === job.id ? (
                                            <div className="flex items-center w-full">
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    className={cn(
                                                      "w-full justify-start text-left font-normal",
                                                      !editForm.tracking_date && "text-muted-foreground"
                                                    )}
                                                  >
                                                    {editForm.tracking_date || "Pick a date"}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-white" align="start">
                                                  <Calendar
                                                    mode="single"
                                                    selected={parseDate(editForm.tracking_date || null)}
                                                    onSelect={(date) => handleDateSelect(date, job.id)}
                                                    initialFocus
                                                    className="p-3 pointer-events-auto"
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                            </div>
                                          ) : (
                                            <div className="flex items-center space-x-2">
                                              <Input 
                                                type="text" 
                                                value={job.tracking_date || ''} 
                                                onChange={(e) => {
                                                  setTrackedJobs(prev => 
                                                    prev.map(j => j.id === job.id 
                                                      ? { ...j, tracking_date: e.target.value } 
                                                      : j
                                                    )
                                                  );
                                                }}
                                                placeholder="DD.MM.YY"
                                                className="w-[85px] h-9 px-2 text-sm"
                                              />
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-gray-500 hover:text-primary"
                                                  >
                                                    <CalendarIcon className="h-4 w-4" />
                                                  </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-white" align="start">
                                                  <Calendar
                                                    mode="single"
                                                    selected={parseDate(job.tracking_date || null)}
                                                    onSelect={(date) => handleDateSelect(date, job.id)}
                                                    initialFocus
                                                    className="p-3 pointer-events-auto"
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {editingJob === job.id ? <Textarea value={editForm.notes || ''} onChange={e => setEditForm(prev => ({
                                ...prev,
                                notes: e.target.value
                              }))} className="min-h-[80px]" /> : <div className="max-h-[80px] overflow-hidden text-sm">
                                              {job.notes ? job.notes.length > 50 ? `${job.notes.slice(0, 50)}...` : job.notes : '-'}
                                            </div>}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            {editingJob === job.id ? <>
                                                <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(job.id)} className="h-8 w-8 text-gray-500 hover:text-green-600">
                                                  <Save className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="h-8 w-8 text-gray-500 hover:text-red-600">
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </> : <>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveJob(job.id)} className="h-8 w-8 text-gray-500 hover:text-red-600">
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(job)} className="h-8 w-8 text-gray-500 hover:text-primary">
                                                  <Edit className="h-4 w-4" />
                                                </Button>
                                              </>}
                                          </div>
                                        </TableCell>
                                      </TableRow>}
                                  </Draggable>)}
                              {provided.placeholder}
                            </TableBody>}
                        </Droppable>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DragDropContext>}
      </div>
    </div>
  );
};

export default Tracker;
