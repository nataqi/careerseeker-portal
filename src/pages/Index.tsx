
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-fadeIn">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Find Your Perfect Job in Sweden
            </h1>
            <p className="text-lg text-gray-600 mt-4">
              Leverage Arbetsförmedlingen's job listings with smart AI-powered tools.
            </p>
          </div>

          <div className="flex justify-center mt-8">
            <Button
              className="button-animation bg-white text-primary border-2 border-primary hover:bg-accent px-8 py-6"
              onClick={() => navigate("/search")}
            >
              Start
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Job Matching",
                description: "Upload your CV and let our AI find the perfect jobs for you",
              },
              {
                title: "Powerful Search",
                description: "Search and filter through thousands of job listings",
              },
              {
                title: "Track Applications",
                description: "Keep track of your job applications in one place",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="card-hover bg-white p-6 rounded-xl shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
