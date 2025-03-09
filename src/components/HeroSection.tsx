
import React from "react";

interface HeroSectionProps {
  title: string;
  description?: string;
}

export const HeroSection = ({ title, description }: HeroSectionProps) => {
  return (
    <div className="hero-section sticky top-0 z-10">
      <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-5 text-center relative z-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{title}</h1>
        {description && (
          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
