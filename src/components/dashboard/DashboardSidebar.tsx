"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isUiDevMode } from "@/utils/ui-dev-mode";

type DashboardSidebarProps = {
  isExpanded: boolean;
  onToggle: () => void;
};

const navigationItems = [
  { href: "/", label: "Executive Summary", icon: "/ExecutiveSummary.svg" },
  { href: "/key-market-indicators", label: "Key Market Indicators", icon: "/KeyMarketIndicators.svg" },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DashboardSidebar({ isExpanded, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const displayName = isUiDevMode ? "Demo User" : user?.displayName || user?.username || "User";
  const role = isUiDevMode ? "UI Development" : user?.jobTitle || user?.department || "Forecast Pulse";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[60] flex flex-col overflow-hidden rounded-r-[40px] bg-primary px-3 py-6 text-white shadow-[8px_0_28px_rgba(47,84,149,0.16)] transition-[width,padding] duration-300 ease-out ${
        isExpanded ? "w-[72px] sm:w-[228px] sm:px-5" : "w-[72px]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={isExpanded}
        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        className="relative h-[46px] w-full shrink-0 cursor-pointer overflow-hidden rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <Image
          src="/NAPlogo.svg"
          alt="NewAmsterdam Pharma"
          width={184}
          height={46}
          priority
          className="absolute left-0 top-0 h-[46px] w-[184px] max-w-none"
        />
      </button>

      <nav aria-label="Dashboard sections" className="mt-8 flex flex-col gap-3">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={!isExpanded ? item.label : undefined}
              className={`flex h-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                isExpanded ? "justify-center px-0 sm:justify-start sm:gap-3 sm:px-3" : "justify-center px-0"
              } ${isActive ? "bg-white/16 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"}`}
            >
              <Image src={item.icon} alt="" width={18} height={18} className="h-[18px] w-[18px] shrink-0" />
              {isExpanded ? (
                <span className="sidebar-label-enter hidden whitespace-nowrap text-xs font-medium sm:block">{item.label}</span>
              ) : null}
            </Link>
          );
        })}
        <button
          type="button"
          title={!isExpanded ? "Market Access" : undefined}
          className={`flex h-11 cursor-pointer items-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
            isExpanded ? "justify-center px-0 sm:justify-start sm:gap-3 sm:px-3" : "justify-center px-0"
          }`}
        >
          <span aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
          {isExpanded ? (
            <span className="hidden whitespace-nowrap text-xs font-medium sm:block">Market Access</span>
          ) : null}
        </button>
      </nav>

      <div className="mt-auto border-t border-white/35 pt-5">
        <div className={`flex items-center ${isExpanded ? "justify-center sm:justify-start sm:gap-3" : "justify-center"}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/75 bg-[#eef2f8] text-xs font-bold text-primary shadow-sm">
            {initials(displayName) || "DU"}
          </div>
          {isExpanded ? (
            <div className="sidebar-label-enter hidden min-w-0 flex-1 sm:block">
              <div className="truncate text-sm font-medium text-white">{displayName}</div>
              <div className="mt-0.5 truncate text-[10px] text-white/75">{role}</div>
            </div>
          ) : null}
          {isExpanded && !isUiDevMode ? (
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Sign out"
              title="Sign out"
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white sm:flex"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
