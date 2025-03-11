
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import DynamicBackground from "@/components/DynamicBackground";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-1 to-green-100">
      <div className="w-full min-h-screen py-16 md:py-24 bg-[#e0ec1a]/[0.29]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 fade-in">
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

          <div className="mt-24 grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-5xl mx-auto px-4">
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
                className="card-hover bg-white p-8 rounded-xl shadow-soft scale-in flex flex-col justify-center w-full h-full" 
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
