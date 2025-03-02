import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BriefcaseIcon, Star, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleSearch = async () => {
    if (!searchTerm) {
      toast({
        title: "Error",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `https://jobsearchai-79e5bfa49931.herokuapp.com/search?query=${searchTerm}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch search results",
        variant: "destructive",
      });
    }
  };

  const handleSaveJob = async (job: any) => {
    try {
      const response = await fetch(
        "https://jobsearchai-79e5bfa49931.herokuapp.com/save-job",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user?.id,
            job_id: job.id,
            headline: job.headline,
            employer_name: job.employer_name,
            workplace_city: job.workplace_city,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      toast({
        title: "Job Saved",
        description: result.message || "Job saved successfully!",
      });
    } catch (error: any) {
      console.error("Save job error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save job",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary">
      <NavBar />
      
      <div className="bg-white border-b">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="text-center py-16 space-y-4">
            <h1 className="text-5xl font-bold text-gray-900">
              Search Jobs
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find the perfect job opportunity from thousands of listings.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-[1200px] px-4 py-8">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for jobs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((job: any) => (
                <Card key={job.id} className="p-4 card-hover bg-white">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {job.headline}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
                        <BriefcaseIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{job.employer_name}</span>
                        {job.workplace_city && (
                          <>
                            <span>•</span>
                            <span>{job.workplace_city}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleSaveJob(job)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            searchTerm && (
              <Card className="p-4 bg-white">
                <div className="flex items-center space-x-3 text-gray-500">
                  <AlertTriangle className="w-5 h-5" />
                  <p>No results found.</p>
                </div>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
