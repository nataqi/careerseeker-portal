import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import DynamicBackground from "@/components/DynamicBackground";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-custom-green-1 via-custom-green-2 to-custom-green-1 animate-soft-gradient-move bg-200%">
      <div className="container-width py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8 fade-in">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
              Find Your Tech Job in Sweden
            </h1>
            <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
              Leverage Arbetsförmedlingen's job listings with smart AI-powered tools.
            </p>
          </div>

          <div className="flex justify-center mt-12">
            <Button 
              className="button-animation text-lg bg-primary hover:bg-primary-hover text-white px-10 py-7 rounded-xl shadow-md" 
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
          </div>

          <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
            {[
              {
                title: "Smart Job Matching",
                description: "Upload your CV and let our AI find the perfect jobs for you"
              }, 
              {
                title: "Powerful Search",
                description: "Search and filter through thousands of job listings"
              }, 
              {
                title: "Track Applications",
                description: "Keep track of your job applications in one place"
              },
              {
                title: "CV Tailoring",
                description: "Optimize your CV for specific job listings with AI-powered suggestions"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="card-hover bg-white p-6 rounded-xl shadow-soft scale-in flex flex-col justify-center w-full" 
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
