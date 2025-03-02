
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Home, BookmarkIcon, LineChart, FileText, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const NavBar = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "There was a problem logging out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="container mx-auto max-w-[1200px] px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/search")}
              className="text-gray-600 hover:text-gray-900"
            >
              <Home className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/saved-jobs")}
              className="text-gray-600 hover:text-gray-900"
            >
              <BookmarkIcon className="w-4 h-4 mr-2" />
              Saved Jobs
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/tracker")}
              className="text-gray-600 hover:text-gray-900"
            >
              <LineChart className="w-4 h-4 mr-2" />
              Tracker
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/cv-tailoring")}
              className="text-gray-600 hover:text-gray-900"
            >
              <FileText className="w-4 h-4 mr-2" />
              CV Tailoring
            </Button>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NavBar;
