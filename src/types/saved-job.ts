
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
  application_date: string | null;
  response_status: ApplicationStatus;
  interview_date: string | null;
  notes: string | null;
  display_order: number;
}

