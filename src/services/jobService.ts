import { JobSearchResponse } from "@/types/job";

const API_URL = "https://jobsearch.api.jobtechdev.se/search";

export type PublishDateFilter = "last-hour" | "today" | "last-7-days" | "last-30-days" | "";
export type WorkTimeTypeFilter = "full-time" | "part-time" | "";

export const publishDateFilterOptions = [
  { value: "", label: "All jobs" },
  { value: "today", label: "Today" },
  { value: "last-7-days", label: "Last 7 days" },
  { value: "last-30-days", label: "Last 30 days" }
];

export const workTimeFilterOptions = [
  { value: "", label: "All jobs" },
  { value: "full-time", label: "Full-time (100%)" },
  { value: "part-time", label: "Part-time (< 100%)" }
];

const applyPublishDateFilter = (params: URLSearchParams, filter: PublishDateFilter): void => {
  if (!filter) return;
  
  console.log(`[DEBUG] Applying date filter: ${filter}`);
  
  const now = new Date();
  
  switch (filter) {
    case 'last-hour':
      params.append('published-after', new Date(now.setHours(now.getHours() - 1)).toISOString());
      console.log(`[INFO] Applied date filter: ${filter}, date: ${new Date(now.setHours(now.getHours() - 1)).toISOString()}`);
      break;
    case 'today':
      params.append('published-after', new Date(now.setHours(0, 0, 0, 0)).toISOString());
      console.log(`[INFO] Applied date filter: ${filter}, date: ${new Date(now.setHours(0, 0, 0, 0)).toISOString()}`);
      break;
    case 'last-7-days':
      params.append('published-after', new Date(now.setDate(now.getDate() - 7)).toISOString());
      console.log(`[INFO] Applied date filter: ${filter}, date: ${new Date(now.setDate(now.getDate() - 7)).toISOString()}`);
      break;
    case 'last-30-days':
      params.append('published-after', new Date(now.setDate(now.getDate() - 30)).toISOString());
      console.log(`[INFO] Applied date filter: ${filter}, date: ${new Date(now.setDate(now.getDate() - 30)).toISOString()}`);
      break;
    default:
      // No date filter applied
      break;
  }
};

const applyWorkTimeFilter = (params: URLSearchParams, filter: WorkTimeTypeFilter): void => {
  if (!filter) return;
  
  console.log(`[DEBUG] Applying work time filter: ${filter}`);
  
  if (filter === 'full-time') {
    // For full-time jobs (100%)
    params.append('parttime.min', '100');
    params.append('parttime.max', '100');
    console.log(`[INFO] Applied full-time filter (parttime.min=100, parttime.max=100)`);
  } else if (filter === 'part-time') {
    // For part-time jobs (try without setting min value)
    // params.append('parttime.min', '1'); // Commenting this out as it might be too restrictive
    params.append('parttime.max', '99');
    console.log(`[INFO] Applied part-time filter (parttime.max=99)`);
  }
};

export const searchJobs = async (
  query: string, 
  offset: number = 0,
  limit: number = 10,
  publishDateFilter: PublishDateFilter = "",
  workTimeTypeFilter: WorkTimeTypeFilter = "",
  mode: "OR" | "AND" = "OR"
): Promise<JobSearchResponse> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    // Apply filters
    applyPublishDateFilter(params, publishDateFilter);
    applyWorkTimeFilter(params, workTimeTypeFilter);

    // Log the final URL with all parameters
    const finalUrl = `${API_URL}?${params.toString()}`;
    console.log(`[DEBUG] Final API URL: ${finalUrl}`);
    
    const response = await fetch(`${API_URL}?${params.toString()}`, {
      headers: {
        'accept': 'application/json',
        'x-feature-freetext-bool-method': 'or',
        'x-feature-disable-smart-freetext': 'false',
        'x-feature-enable-false-negative': 'true'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ERROR] API error: ${response.status}, ${errorText}`);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[DEBUG] Filter: ${workTimeTypeFilter || 'all'}, Total jobs: ${data.total?.value || 0}`);
    
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
