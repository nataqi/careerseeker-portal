
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
          tracking_date: null
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
      const { error } = await supabase
        .from('saved_jobs')
        .update({ response_status: status })
        .eq('id', jobId);

      if (error) throw error;

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
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
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
            tracking_date: currentDate
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
  };
};
