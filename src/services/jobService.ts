
import { JobSearchResponse } from "@/types/job";

const API_URL = "https://links.api.jobtechdev.se/joblinks/search";

export const searchJobs = async (query: string): Promise<JobSearchResponse> => {
  try {
    const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};
