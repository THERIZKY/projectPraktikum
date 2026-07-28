"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { User, LogOut, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getRoleVariant = (role: string) => {
    if (role === "SYSTEM_ADMIN") return "destructive";
    if (role === "LAB_ADMIN") return "default";
    if (role === "ASSISTANT") return "warning";
    return "secondary";
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-sm shadow-sm">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden md:block">
          <div className="text-sm font-semibold text-slate-800 leading-tight">{user.fullName}</div>
          <div className="text-xs text-slate-500 font-mono">@{user.username}</div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
            <p className="text-xs text-slate-500 mb-1.5">@{user.username}</p>
            <Badge variant={getRoleVariant(user.role)} className="text-[10px] uppercase">
              {user.role.replace("_", " ")}
            </Badge>
          </div>

          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <User className="h-4 w-4 text-slate-500" />
            My Profile
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-red-500" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
