
import { UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

export const AuthLayout = ({ children, title, subtitle, icon }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/30 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-sm scale-in">
        <div className="text-center space-y-2">
          <div className="inline-flex justify-center items-center w-16 h-16 bg-accent rounded-full mb-4">
            {icon || <UserRound className="w-8 h-8 text-primary" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 text-lg">{subtitle}</p>
        </div>
        {children}
      </Card>
    </div>
  );
};
