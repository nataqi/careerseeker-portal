import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Adjust the import path as needed
import { SavedJob } from "@/types"; // Ensure this type is defined

export interface SavedJob {
  id: string;
  user_id: string;
  is_tracked: boolean;
  headline: string;
  employer_name: string;
  // Add other fields as needed
}

const useSavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);

  // Fetch saved jobs from Supabase on mount
  useEffect(() => {
    const fetchSavedJobs = async () => {
      const { data: { user } } = await supabase.auth.getUser(); // Get the current user
      if (!user) return; // Exit if no user is logged in

      const { data, error } = await supabase
        .from("savedjobs")
        .select("*")
        .eq("user_id", user.id); // Fetch jobs for the current user

      if (error) {
        console.error("Error fetching saved jobs:", error);
      } else {
        setSavedJobs(data);
      }
    };

    fetchSavedJobs();
  }, []);

  const toggleJobTracking = async (jobId: string, isTracked: boolean) => {
    try {
      // Update the job in Supabase
      const { error } = await supabase
        .from("savedjobs")
        .update({ is_tracked: isTracked })
        .eq("id", jobId);

      if (error) {
        console.error("Error updating job tracking status:", error);
      } else {
        // Update the local state
        setSavedJobs((prevJobs) =>
          prevJobs.map((job) =>
            job.id === jobId ? { ...job, is_tracked: isTracked } : job
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle job tracking:", error);
    }
  };

  return { savedJobs, toggleJobTracking };
};

export default useSavedJobs;
