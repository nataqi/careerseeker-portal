import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4A6741",
          hover: "#5B7D52",
        },
        secondary: "#F5F5F5",
        accent: "#E8F3E8",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        'custom-green-1': '#5B7D52', // buttons green
        'custom-green-2': '#e1ebe1', // Dark green
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.5s ease-out forwards",
        shimmer: "shimmer 2s infinite linear",
      },
      boxShadow: {
        'soft': '0 4px 8px rgba(0, 0, 0, 0.04)',
        'medium': '0 6px 12px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(74, 103, 65, 0.15)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, rgba(232, 243, 232, 0.8) 0%, rgba(74, 103, 65, 0.1) 100%)',
        'hero-shine': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
