
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { SavedJob } from '@/types/saved-job';

export const useJobTracking = () => {
  const [trackedJobs, setTrackedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrackedJobs();
    const subscription = supabase
      .channel('tracked_jobs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_jobs' }, 
        () => {
          fetchTrackedJobs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchTrackedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTrackedJobs(data || []);
    } catch (error) {
      console.error('Error fetching tracked jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tracked jobs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, status: SavedJob['response_status']) => {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .update({ response_status: status })
        .eq('id', jobId);

      if (error) throw error;

      setTrackedJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, response_status: status } : job
        )
      );
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      });
    }
  };

  const updateJobNotes = async (jobId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('saved_jobs')
        .update({ notes })
        .eq('id', jobId);

      if (error) throw error;

      setTrackedJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, notes } : job
        )
      );
    } catch (error) {
      console.error('Error updating job notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job notes',
        variant: 'destructive',
      });
    }
  };

  return {
    trackedJobs,
    isLoading,
    updateJobStatus,
    updateJobNotes,
  };
};
