
import { JobSearchResponse } from "@/types/job";

const API_URL = "https://jobsearch.api.jobtechdev.se/search";

export const searchJobs = async (query: string, mode: "OR" | "AND" | "NOT" | "EXACT"): Promise<JobSearchResponse> => {
  try {
    const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}`, {
      headers: {
        'accept': 'application/json',
        'x-feature-freetext-bool-method': mode === "AND" || mode === "EXACT" ? 'and' : 'or',
        'x-feature-disable-smart-freetext': 'false',
        'x-feature-enable-false-negative': 'true'
      }
    });
    
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
