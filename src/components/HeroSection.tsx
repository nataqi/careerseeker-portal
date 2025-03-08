
import React from "react";

interface HeroSectionProps {
  title: string;
  description?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ title, description }) => {
  return (
    <div className="sticky top-16 z-10 bg-hero-gradient border-b">
      <div className="max-w-[1200px] mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{title}</h1>
        {description && (
          <p className="text-gray-600 max-w-2xl mx-auto">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default HeroSection;
