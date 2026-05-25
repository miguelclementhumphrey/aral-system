import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isProfileComplete } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8">
          {!isProfileComplete && user?.role !== "super_admin" && (
            <div className="mb-6 bg-accent/20 border border-accent text-accent-foreground p-4 rounded-md flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">Profile Incomplete</h3>
                <p className="text-sm mt-1 opacity-90">Please complete your profile to unlock all features.</p>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
