
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import type { SavedJob, ApplicationStatus } from "@/types/saved-job";
import type { JobListing } from "@/types/job";

export const useSavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSavedJobs();
      subscribeToSavedJobs();
    } else {
      setSavedJobs([]);
    }
  }, [user]);

  const fetchSavedJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSavedJobs(data);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch saved jobs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToSavedJobs = () => {
    if (!user) return;

    const channel = supabase
      .channel('saved_jobs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saved_jobs' },
        (payload) => {
          console.log('Realtime update:', payload);
          fetchSavedJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const toggleSaveJob = async (job: JobListing) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save jobs",
        variant: "destructive",
      });
      return;
    }

    const existingSave = savedJobs.find(saved => saved.job_id === job.id);

    if (existingSave) {
      try {
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('job_id', job.id);

        if (error) throw error;

        toast({
          title: "Job unsaved",
          description: "Job removed from saved jobs",
        });
      } catch (error) {
        console.error('Error unsaving job:', error);
        toast({
          title: "Error",
          description: "Failed to unsave job",
          variant: "destructive",
        });
      }
    } else {
      try {
        const { error } = await supabase
          .from('saved_jobs')
          .insert({
            user_id: user.id,
            job_id: job.id,
            headline: job.headline,
            employer_name: job.employer.name,
            workplace_city: job.workplace?.city || null,
            response_status: 'Not Applied',
            display_order: savedJobs.length,
          });

        if (error) throw error;

        toast({
          title: "Job saved",
          description: "Job added to saved jobs",
        });
      } catch (error) {
        console.error('Error saving job:', error);
        toast({
          title: "Error",
          description: "Failed to save job",
          variant: "destructive",
        });
      }
    }
  };

  const updateJobApplication = async (
    jobId: string,
    updates: Partial<SavedJob>
  ) => {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Updated",
        description: "Job application updated successfully",
      });
    } catch (error) {
      console.error('Error updating job application:', error);
      toast({
        title: "Error",
        description: "Failed to update job application",
        variant: "destructive",
      });
    }
  };

  const reorderJobs = async (startIndex: number, endIndex: number) => {
    const newJobs = Array.from(savedJobs);
    const [removed] = newJobs.splice(startIndex, 1);
    newJobs.splice(endIndex, 0, removed);

    // Update display_order for affected jobs
    const updates = newJobs.map((job, index) => ({
      id: job.id,
      display_order: index,
    }));

    try {
      // Optimistically update the UI
      setSavedJobs(newJobs);

      // Update the database
      const { error } = await supabase
        .from('saved_jobs')
        .upsert(updates.map(update => ({
          id: update.id,
          display_order: update.display_order,
        })));

      if (error) throw error;
    } catch (error) {
      console.error('Error reordering jobs:', error);
      // Revert optimistic update on error
      fetchSavedJobs();
      toast({
        title: "Error",
        description: "Failed to reorder jobs",
        variant: "destructive",
      });
    }
  };

  const isJobSaved = (jobId: string) => {
    return savedJobs.some(saved => saved.job_id === jobId);
  };

  return {
    savedJobs,
    isLoading,
    toggleSaveJob,
    isJobSaved,
    updateJobApplication,
    reorderJobs,
  };
};

