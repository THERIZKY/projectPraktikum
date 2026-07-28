"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  FileSpreadsheet,
  GraduationCap,
  Bell,
  History,
  Megaphone,
  User,
} from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const role = user.role;

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
    {
      title: "User Management",
      href: "/users",
      icon: Users,
      roles: ["SYSTEM_ADMIN"],
    },
    {
      title: "Laboratories",
      href: "/laboratories",
      icon: Building2,
      roles: ["SYSTEM_ADMIN"],
    },
    {
      title: "Practicums",
      href: "/practicums",
      icon: BookOpen,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
    {
      title: "Submissions",
      href: "/submissions",
      icon: FileSpreadsheet,
      roles: ["LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
    {
      title: "Grades",
      href: "/grades",
      icon: GraduationCap,
      roles: ["LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
    {
      title: "Announcements",
      href: "/announcements",
      icon: Megaphone,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
    {
      title: "Notifications",
      href: "/notifications",
      icon: Bell,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
    {
      title: "Audit Log",
      href: "/audit-log",
      icon: History,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN"],
    },
    {
      title: "My Profile",
      href: "/profile",
      icon: User,
      roles: ["SYSTEM_ADMIN", "LAB_ADMIN", "ASSISTANT", "STUDENT"],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-200 flex items-center gap-3">
        <div className="bg-blue-600 text-white font-bold text-lg w-9 h-9 rounded-lg flex items-center justify-center shadow-sm">
          P
        </div>
        <div>
          <h1 className="font-bold text-slate-900 leading-tight">PMS Web</h1>
          <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Practicum System</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-slate-400")} />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
