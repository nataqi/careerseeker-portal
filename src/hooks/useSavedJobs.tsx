
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import type { SavedJob } from "@/types/saved-job";
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Initialize tracking_date for each job with created_at date if not set
      const formattedData: SavedJob[] = (data as any[]).map(job => {
        const jobWithDefaults = {
          ...job,
          application_date: job.application_date || null,
          interview_date: job.interview_date || null,
          notes: job.notes || null,
          response_status: job.response_status || 'Not Applied',
          workplace_city: job.workplace_city || null,
          tracking_date: job.tracking_date || null,
          is_tracked: job.is_tracked || false
        };

        // Set tracking_date to either existing value or formatted created_at date
        jobWithDefaults.tracking_date = jobWithDefaults.tracking_date || formatDate(new Date(job.created_at));
        
        return jobWithDefaults;
      });

      setSavedJobs(formattedData);
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).replace(/\//g, '.');
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

  const updateJobStatus = async (jobId: string, status: SavedJob['response_status']) => {
    if (!user) return;
    
    try {
      console.log(`Updating job status for job ${jobId} to ${status}`);
      
      const { error } = await supabase
        .from('saved_jobs')
        .update({ response_status: status })
        .eq('id', jobId);

      if (error) {
        console.error('Supabase error updating job status:', error);
        throw error;
      }

      // Optimistic update
      setSavedJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, response_status: status } : job
        )
      );

      toast({
        title: "Status updated",
        description: "Job status has been updated successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const toggleJobTracking = async (jobId: string, isTracked: boolean) => {
    if (!user) return;

    try {
      console.log(`Toggling job tracking for job ${jobId} to ${isTracked ? 'tracked' : 'untracked'}`);
      
      const currentDate = formatDate(new Date());
      // Fix the typing issue by explicitly typing the update object
      const updates: Partial<SavedJob> = { 
        is_tracked: isTracked
      };
      
      // Only update tracking_date if turning tracking on
      if (isTracked) {
        updates.tracking_date = currentDate;
      }
      
      const { error } = await supabase
        .from('saved_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) {
        console.error('Supabase error toggling job tracking:', error);
        throw error;
      }

      // Optimistic update
      setSavedJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { 
            ...job, 
            is_tracked: isTracked,
            tracking_date: isTracked ? currentDate : job.tracking_date
          } : job
        )
      );

      toast({
        title: isTracked ? "Job added to tracker" : "Job removed from tracker",
        description: isTracked ? "You can now track the application status" : "Job moved back to saved jobs"
      });
      
      return true;
    } catch (error) {
      console.error('Error updating job tracking status:', error);
      toast({
        title: "Error",
        description: "Failed to update job tracking status",
        variant: "destructive",
      });
      
      return false;
    }
  };

  const updateJobDetails = async (jobId: string, updates: Partial<SavedJob>) => {
    if (!user) return;

    try {
      console.log(`Updating job details for job ${jobId}:`, updates);
      
      const { error } = await supabase
        .from('saved_jobs')
        .update(updates)
        .eq('id', jobId);

      if (error) {
        console.error('Supabase error updating job details:', error);
        throw error;
      }

      // Optimistic update
      setSavedJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, ...updates } : job
        )
      );

      toast({
        title: "Job updated",
        description: "Job details have been updated successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error updating job details:', error);
      toast({
        title: "Error",
        description: "Failed to update job details",
        variant: "destructive",
      });
      
      return false;
    }
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
        const currentDate = formatDate(new Date());
        const { error } = await supabase
          .from('saved_jobs')
          .insert({
            user_id: user.id,
            job_id: job.id,
            headline: job.headline,
            employer_name: job.employer.name,
            workplace_city: job.workplace?.city || null,
            tracking_date: null,
            is_tracked: false
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

  const isJobSaved = (jobId: string) => {
    return savedJobs.some(saved => saved.job_id === jobId);
  };

  return {
    savedJobs,
    isLoading,
    toggleSaveJob,
    isJobSaved,
    updateJobStatus,
    toggleJobTracking,
    updateJobDetails
  };
};
