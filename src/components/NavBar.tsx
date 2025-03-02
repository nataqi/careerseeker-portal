
import { useNavigate } from "react-router-dom";
import { BriefcaseIcon, BookmarkIcon, Search as SearchIcon, FileEdit, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const NavBar = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  
  return (
    <div className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
            onClick={() => navigate("/search")}
          >
            <SearchIcon className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Search</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
            onClick={() => navigate("/saved-jobs")}
          >
            <BookmarkIcon className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Saved Jobs</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
            onClick={() => navigate("/tracker")}
          >
            <BriefcaseIcon className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Job Tracker</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
            onClick={() => navigate("/cv-tailoring")}
          >
            <FileEdit className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">CV Tailoring</span>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-gray-900"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </div>
  );
};
