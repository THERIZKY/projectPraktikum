"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (isAuthenticated) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-2">
        <svg className="h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm font-medium text-slate-500">Loading Practicum Management System...</span>
      </div>
    </div>
  );
}
