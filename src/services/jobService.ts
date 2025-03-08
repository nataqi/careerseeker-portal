import { JobSearchResponse } from "@/types/job";

const API_URL = "https://jobsearch.api.jobtechdev.se/search";

type PublishDateFilter = "last-hour" | "today" | "last-7-days" | "last-30-days" | "";

export const searchJobs = async (
  query: string, 
  offset: number = 0,
  limit: number = 10,
  publishDateFilter: PublishDateFilter = "",
  mode: "OR" | "AND" = "OR"
): Promise<JobSearchResponse> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    // Add publish date filter if selected
    let publishedAfter = '';
    if (publishDateFilter) {
      const now = new Date();
      
      switch (publishDateFilter) {
        case 'last-hour':
          publishedAfter = new Date(now.setHours(now.getHours() - 1)).toISOString();
          break;
        case 'today':
          publishedAfter = new Date(now.setHours(0, 0, 0, 0)).toISOString();
          break;
        case 'last-7-days':
          publishedAfter = new Date(now.setDate(now.getDate() - 7)).toISOString();
          break;
        case 'last-30-days':
          publishedAfter = new Date(now.setDate(now.getDate() - 30)).toISOString();
          break;
        default:
          publishedAfter = '';
      }
      
      if (publishedAfter) {
        params.append('published-after', publishedAfter);
        console.log(`[INFO] Applied date filter: ${publishDateFilter}, date: ${publishedAfter}`);
      }
    }

    console.log(`[INFO] Searching jobs with query: "${query}", offset: ${offset}, limit: ${limit}, date filter: ${publishDateFilter || 'none'}`);
    
    const response = await fetch(`${API_URL}?${params.toString()}`, {
      headers: {
        'accept': 'application/json',
        'x-feature-freetext-bool-method': 'and',
        'x-feature-disable-smart-freetext': 'false',
        'x-feature-enable-false-negative': 'true'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[INFO] Found ${data.total?.value || 0} total jobs, returning ${data.hits?.length || 0} results`);
    
    return {
      hits: data.hits || [],
      total: {
        value: data.total?.value || 0
      }
    };
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};
