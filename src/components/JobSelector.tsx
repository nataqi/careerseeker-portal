
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BriefcaseIcon, Building, MapPin } from 'lucide-react';
import type { SavedJob } from "@/types/saved-job";

interface JobSelectorProps {
  savedJobs: SavedJob[];
  onSelectJob: (job: SavedJob) => void;
  selectedJobId: string | null;
}

const JobSelector = ({ savedJobs, onSelectJob, selectedJobId }: JobSelectorProps) => {
  return (
    <Card className="p-4 bg-white shadow-sm">
      <div className="text-lg font-semibold mb-3">Select a Job</div>
      
      <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
        {savedJobs.length > 0 ? (
          savedJobs.map((job) => (
            <div 
              key={job.id} 
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedJobId === job.job_id 
                  ? 'border-primary bg-accent' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectJob(job)}
            >
              <div className="font-medium text-gray-900 mb-1 line-clamp-2">{job.headline}</div>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Building className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                <span className="truncate">{job.employer_name}</span>
              </div>
              {job.workplace_city && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                  <span>{job.workplace_city}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <BriefcaseIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No saved jobs found</p>
            <Button 
              className="mt-3" 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/search'}
            >
              Search Jobs
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default JobSelector;
