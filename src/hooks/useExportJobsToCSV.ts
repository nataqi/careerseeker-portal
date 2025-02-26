
import { supabase } from '@/integrations/supabase/client';
import type { SavedJob } from '@/types/saved-job';

export const useExportJobsToCSV = () => {
  const exportJobsToCSV = async () => {
    const { data: jobs, error } = await supabase
      .from('saved_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Convert jobs to CSV format
    const headers = [
      'Job Title',
      'Employer',
      'Location',
      'Status',
      'Date',
      'Notes',
    ].join(',');

    const rows = jobs.map((job: SavedJob) => {
      return [
        `"${job.headline.replace(/"/g, '""')}"`,
        `"${job.employer_name.replace(/"/g, '""')}"`,
        `"${(job.workplace_city || '').replace(/"/g, '""')}"`,
        `"${job.response_status}"`,
        `"${job.tracking_date || ''}"`,
        `"${(job.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'job_tracker.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { exportJobsToCSV };
};
