"use client";

import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";

export function AppHeader() {
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path.startsWith("/dashboard")) return "Dashboard";
    if (path.startsWith("/users")) return "User Management";
    if (path.startsWith("/laboratories")) return "Laboratory Management";
    if (path.startsWith("/practicums")) return "Practicums";
    if (path.startsWith("/submissions")) return "Submissions";
    if (path.startsWith("/grades")) return "Grades & Evaluation";
    if (path.startsWith("/announcements")) return "Announcements";
    if (path.startsWith("/notifications")) return "Notifications";
    if (path.startsWith("/audit-log")) return "Audit Logs";
    if (path.startsWith("/profile")) return "User Profile";
    return "Practicum System";
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{getPageTitle(pathname)}</h2>
      </div>
      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  );
}
