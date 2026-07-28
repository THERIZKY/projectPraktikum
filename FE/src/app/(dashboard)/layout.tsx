"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm font-medium text-slate-500">Checking session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
