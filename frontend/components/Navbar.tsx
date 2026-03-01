"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Send, History, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { href: "/transactions", label: "Analyze", icon: Send },
  { href: "/history", label: "History", icon: History },
];

export default function Navbar() {
  const { isAuthenticated, email, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-600/30">
              <Shield className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-white tracking-tight">
              FraudShield
            </span>
          </Link>

          {/* Nav links — only when authenticated */}
          {isAuthenticated && (
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    {active && (
                      <ChevronRight className="h-3 w-3 text-gray-500" />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User info + logout */}
          {isAuthenticated && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden sm:block max-w-[160px] truncate text-xs text-gray-500">
                {email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
