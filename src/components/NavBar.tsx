import { useNavigate } from "react-router-dom";
import { BriefcaseIcon, BookmarkIcon, Search as SearchIcon, FileEdit, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
export const NavBar = () => {
  const navigate = useNavigate();
  const {
    signOut
  } = useAuth();
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  return <div className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between h-16 bg-gray-50">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/search")} className="font-normal text-slate-900">
            <SearchIcon className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Search</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/saved-jobs")} className="text-slate-900">
            <BookmarkIcon className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Saved Jobs</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/tracker")} className="text-slate-900">
            <BriefcaseIcon className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Job Tracker</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/cv-tailoring")} className="font-normal text-slate-900">
            <FileEdit className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">CV Tailoring</span>
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-200 bg-gray-900 hover:bg-gray-800">
          <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </div>;
};