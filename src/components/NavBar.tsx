
import { useNavigate } from "react-router-dom";
import { BriefcaseIcon, BookmarkIcon, Search as SearchIcon, FileEdit, LogOut, Home } from "lucide-react";
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
      <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        <Button
          variant="ghost"
          size="sm"
          className="font-medium text-primary hover:text-primary-hover hover:bg-accent"
          onClick={() => navigate("/")}
        >
          <Home className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Job Finder</span>
        </Button>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          <NavButton 
            icon={<SearchIcon className="w-4 h-4" />} 
            label="Search" 
            onClick={() => navigate("/search")} 
          />
          <NavButton 
            icon={<BookmarkIcon className="w-4 h-4" />} 
            label="Saved Jobs" 
            onClick={() => navigate("/saved-jobs")} 
          />
          <NavButton 
            icon={<BriefcaseIcon className="w-4 h-4" />} 
            label="Job Tracker" 
            onClick={() => navigate("/tracker")} 
          />
          <NavButton 
            icon={<FileEdit className="w-4 h-4" />} 
            label="CV Tailoring" 
            onClick={() => navigate("/cv-tailoring")} 
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400 hover:bg-gray-100"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </div>
  );
};

const NavButton = ({ icon, label, onClick }: { 
  icon: React.ReactNode, 
  label: string, 
  onClick: () => void 
}) => (
  <Button
    variant="ghost"
    size="sm"
    className="relative text-gray-700 hover:text-primary hover:bg-accent rounded-lg transition-all duration-200 px-3 py-2 h-10"
    onClick={onClick}
  >
    <span className="flex items-center">
      <span className="mr-1.5 sm:mr-2">{icon}</span>
      <span className="hidden sm:inline font-medium">{label}</span>
    </span>
  </Button>
);
