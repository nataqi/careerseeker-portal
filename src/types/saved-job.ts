
export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  headline: string;
  employer_name: string;
  workplace_city: string | null;
  created_at: string;
}
