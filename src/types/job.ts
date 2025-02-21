
export interface JobListing {
  id: string;
  headline: string;
  employer: {
    name: string;
  };
  description: {
    text: string;
  };
  application_details: {
    url: string;
    email?: string;
    other?: string;
  };
  workplace: {
    city: string;
  };
  working_hours_type: {
    label: string;
  };
  salary_type: {
    label: string;
  };
}

export interface JobSearchResponse {
  hits: JobListing[];
  total: {
    value: number;
  };
}
