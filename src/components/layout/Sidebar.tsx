"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/classes", icon: BookOpen, label: "Classes" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar({ profile }: { profile: Profile }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / University */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          {profile.university_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.university_logo_url}
              alt="University Logo"
              className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-primary-600/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-primary-300" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate leading-tight">
              {profile.university_name || "Professor Portal"}
            </p>
            <p className="text-primary-400 text-xs truncate mt-0.5">
              {profile.name || "Professor"}
            </p>
            {profile.phone && (
              <p className="text-slate-500 text-xs truncate mt-0.5">{profile.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive =
            (item.href === "/" && pathname === "/") ||
            (item.href !== "/" && (pathname === item.href || pathname.startsWith(item.href)));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-primary-600/20 text-primary-300 border border-primary-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-primary-400" : ""
                )}
              />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all w-full group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-950 min-h-screen fixed left-0 top-0 z-30 border-r border-white/5">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-950 border-b border-white/10 px-4 py-3 flex items-center justify-between h-14">
        <div className="flex items-center gap-2.5">
          {profile.university_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.university_logo_url}
              alt="University"
              className="w-7 h-7 rounded-lg object-contain bg-white/10 p-0.5 flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 bg-primary-600/30 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-300" />
            </div>
          )}
          <span className="text-white font-semibold text-sm">
            {profile.university_name || "Professor Portal"}
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-slate-950 z-50 border-r border-white/10"
            >
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
