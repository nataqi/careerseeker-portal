
import { JobSearchResponse } from "@/types/job";

const API_URL = "https://jobsearch.api.jobtechdev.se/search";

interface SearchOptions {
  mode: "OR" | "AND";
  isCompoundSkill?: boolean;
}

export const searchJobs = async (query: string, mode: "OR" | "AND"): Promise<JobSearchResponse> => {
  try {
    // For compound skills, we want to ensure all words are present
    const formattedQuery = mode === "AND" ? 
      query.split(" ").filter(Boolean).map(term => `+${term}`).join(" ") : 
      query;

    const response = await fetch(`${API_URL}?q=${encodeURIComponent(formattedQuery)}`, {
      headers: {
        'accept': 'application/json',
        'x-feature-freetext-bool-method': mode === "AND" ? 'and' : 'or',
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

export const searchJobsWithSkills = async (compoundSkills: string[], singleSkills: string[]): Promise<JobSearchResponse> => {
  // Build a query that combines compound and single skills
  const compoundQueries = compoundSkills.map(skill => 
    `(${skill.split(' ').map(word => `+${word}`).join(' ')})`
  );
  
  const singleQueries = singleSkills.map(skill => `+${skill}`);
  
  // Combine all queries
  const query = [...compoundQueries, ...singleQueries].join(' ');
  
  return searchJobs(query, "AND");
};

