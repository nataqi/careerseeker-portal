
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, Upload, BriefcaseIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      toast({
        title: "Coming soon!",
        description: "CV upload and automatic job matching will be implemented with Supabase integration.",
      });
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
    }
  };

  const mockJobs = [
    {
      title: "Senior Software Engineer",
      company: "TechCorp",
      location: "San Francisco, CA",
      type: "Full-time",
      salary: "$120,000 - $180,000",
    },
    {
      title: "Product Designer",
      company: "DesignStudio",
      location: "New York, NY",
      type: "Full-time",
      salary: "$90,000 - $130,000",
    },
    {
      title: "Marketing Manager",
      company: "GrowthCo",
      location: "Remote",
      type: "Full-time",
      salary: "$80,000 - $120,000",
    },
  ];

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search jobs by title, company, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button className="bg-primary hover:bg-primary-hover text-white">
                Search
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="cv-upload"
                />
                <label htmlFor="cv-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-primary text-primary hover:bg-accent"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CV
                  </Button>
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {mockJobs.map((job, index) => (
              <Card
                key={index}
                className="p-6 card-hover bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <BriefcaseIcon className="w-4 h-4" />
                      <span>{job.company}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="inline-block bg-accent text-primary text-sm px-3 py-1 rounded-full">
                        {job.type}
                      </span>
                      <span className="inline-block bg-secondary text-gray-600 text-sm px-3 py-1 rounded-full">
                        {job.salary}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Coming soon!",
                        description: "Job application functionality will be implemented with Supabase integration.",
                      });
                    }}
                    className="bg-primary hover:bg-primary-hover text-white"
                  >
                    Apply Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
