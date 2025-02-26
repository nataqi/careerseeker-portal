
export type ApplicationStatus = 
  | "Not Applied"
  | "Applied"
  | "No Response"
  | "Rejected"
  | "Interview Scheduled"
  | "Offer Received"
  | "Offer Accepted"
  | "Offer Declined";

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  headline: string;
  employer_name: string;
  workplace_city: string | null;
  created_at: string;
  response_status: ApplicationStatus | null;
  application_date: string | null;
  interview_date: string | null;
  notes: string | null;
  display_order: number | null;
  tracking_date: string | null;
}
