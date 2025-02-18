"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  SparklesIcon,
  XMarkIcon,
  Bars3Icon,
  DocumentCheckIcon,
  ClockIcon,
  DocumentPlusIcon,
  ArrowRightStartOnRectangleIcon,
  CodeBracketIcon,
  UserGroupIcon,
  ChartBarIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  HomeIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

interface NavItem {
  path: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  badge?: string;
}

interface DashboardMetrics {
  totalJobs: number;
  activeJobs: number;
  expiredJobs: number;
  pendingJobs: number;
}

const AdminDashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState("ADMIN");

  const dashboardMetrics: DashboardMetrics = {
    totalJobs: 124,
    activeJobs: 87,
    expiredJobs: 37,
    pendingJobs: 12,
  };

  const navItems: NavItem[] = [
    // Main
    {
      path: "/dashboard/admin",
      text: "Dashboard",
      icon: HomeIcon,
      group: "Main"
    },

    // Job Management
    {
      path: "/dashboard/admin/jobs",
      text: "All Jobs",
      icon: BriefcaseIcon,
      group: "Job Management"
    },
    {
      path: "/dashboard/admin/jobs/create",
      text: "Create Job",
      icon: DocumentPlusIcon,
      group: "Job Management"
    },
    {
      path: "/dashboard/admin/applications",
      text: "Applications",
      icon: ClipboardDocumentCheckIcon,
      group: "Job Management"
    },

    // User Management
    {
      path: "/dashboard/admin/employers",
      text: "Employers",
      icon: BuildingOfficeIcon,
      group: "User Management"
    },
    {
      path: "/dashboard/admin/users",
      text: "Users",
      icon: UserGroupIcon,
      group: "User Management"
    },

    // Analytics & Finance
    {
      path: "/dashboard/admin/analytics",
      text: "Analytics",
      icon: ChartBarIcon,
      group: "Analytics & Finance"
    },
    {
      path: "/dashboard/admin/finance/fees",
      text: "Service Fees",
      icon: CurrencyDollarIcon,
      group: "Analytics & Finance"
    },
    {
      path: "/dashboard/admin/finance/transactions",
      text: "Transactions",
      icon: CurrencyDollarIcon,
      group: "Analytics & Finance"
    },

    // System
    {
      path: "/dashboard/admin/settings",
      text: "Settings",
      icon: Cog6ToothIcon,
      group: "System"
    },
    {
      path: "/dashboard/admin/system/contract",
      text: "Contract Status",
      icon: WrenchScrewdriverIcon,
      group: "System"
    },
    {
      path: "/dashboard/admin/system/logs",
      text: "Logs",
      icon: DocumentTextIcon,
      group: "System"
    }
  ];

  const groupedNavItems = navItems.reduce((acc, item) => {
    const group = item.path.split("/")[3] || "General";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    // Implement logout logic
    router.push("/");
  };

  const Sidebar = () => (
    <div
      className={clsx(
        "fixed inset-y-0 z-50 flex w-72 flex-col custom-scrollbar scrollbar-dark",
        "transform transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:translate-x-0"
      )}
    >
      {/* Header (Fixed) */}
      <div className="px-6 py-4 border-b border-gray-800/30 flex items-center justify-between">
        <div className="flex items-center">
          <SparklesIcon className="h-8 w-8 text-green-500 mr-2" />
          <span className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            HemBoard
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-gray-300 hover:text-white"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Dashboard Metrics (Fixed) */}
      <div className="px-4 py-4 border-b border-gray-800/30 grid grid-cols-2 gap-2 bg-black/20">
        <div className="bg-gray-800/30 p-2 rounded-lg text-center hover:bg-gray-800/50 transition-all">
          <div className="text-xs text-gray-400">Total Jobs</div>
          <div className="text-lg font-bold text-white">
            {dashboardMetrics.totalJobs}
          </div>
        </div>
        <div className="bg-gray-800/30 p-2 rounded-lg text-center hover:bg-gray-800/50 transition-all">
          <div className="text-xs text-gray-400">Active Jobs</div>
          <div className="text-lg font-bold text-green-500 flex items-center justify-center">
            <DocumentCheckIcon className="h-4 w-4 mr-1" />
            {dashboardMetrics.activeJobs}
          </div>
        </div>
        <div className="bg-gray-800/30 p-2 rounded-lg text-center hover:bg-gray-800/50 transition-all">
          <div className="text-xs text-gray-400">Expired Jobs</div>
          <div className="text-lg font-bold text-red-500 flex items-center justify-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            {dashboardMetrics.expiredJobs}
          </div>
        </div>
        <div className="bg-gray-800/30 p-2 rounded-lg text-center hover:bg-gray-800/50 transition-all">
          <div className="text-xs text-gray-400">Pending Jobs</div>
          <div className="text-lg font-bold text-yellow-500 flex items-center justify-center">
            <DocumentPlusIcon className="h-4 w-4 mr-1" />
            {dashboardMetrics.pendingJobs}
          </div>
        </div>
      </div>

      {/* Navigation (Scrollable) */}
      <nav className="flex-grow overflow-y-auto">
        <div className="space-y-8 px-4 py-6">
          {Object.entries(
            navItems.reduce((acc, item) => {
              if (!acc[item.group]) acc[item.group] = [];
              acc[item.group].push(item);
              return acc;
            }, {} as Record<string, NavItem[]>)
          ).map(([group, items]) => (
            <div key={group} className="relative">
              {/* Group Header with Line */}
              <div className="relative flex items-center mb-4">
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-[#0F172A] z-10">
                  {group}
                </h3>
                <div className="absolute inset-0 flex items-center">
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-700/50 to-transparent"></div>
                </div>
              </div>

              {/* Group Items */}
              <div className="space-y-1 pl-2">
                {items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={clsx(
                      "w-full flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 text-left",
                      "relative group hover:bg-gray-800/50",
                      pathname === item.path
                        ? "bg-green-500/10 text-green-400"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    {/* Active Indicator */}
                    {pathname === item.path && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-green-500 rounded-r-full" />
                    )}

                    {/* Icon */}
                    <item.icon
                      className={clsx(
                        "w-5 h-5 mr-3 flex-shrink-0 transition-transform duration-200",
                        pathname === item.path
                          ? "text-green-400"
                          : "text-gray-500 group-hover:text-white",
                        "group-hover:scale-110"
                      )}
                    />

                    {/* Text */}
                    <span className="text-sm font-medium truncate flex-grow">
                      {item.text}
                    </span>

                    {/* Badge */}
                    {item.badge && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500/10 text-red-400 rounded-full">
                        {item.badge}
                      </span>
                    )}

                    {/* Hover Effect */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-500/0 to-green-500/0 opacity-0 group-hover:opacity-5 transition-opacity duration-200" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* User & Logout (Fixed) */}
      <div className="px-4 py-4 border-t border-gray-800/30 flex items-center bg-black/20">
        <div className="flex-shrink-0 mr-3">
          <CodeBracketIcon className="h-8 w-8 text-gray-400 rounded-full" />
        </div>
        <div className="flex-grow">
          <div className="text-sm font-medium text-gray-200 truncate">
            {address
              ? `${address.slice(0, 6)}...${address.slice(-4)}`
              : "Not Connected"}
          </div>
          <div className="text-xs text-gray-400">
            {adminRole.replace("_", " ")}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-black">
      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          ></div>
          <div className="absolute inset-y-0 left-0 max-w-xs w-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="h-screen flex flex-col">
          <div className="flex-grow overflow-y-auto">
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <div className="bg-black/90 py-2 px-4 flex items-center justify-between sm:px-6 lg:px-8 border-b border-gray-800/30">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-gray-300 hover:text-white"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-medium text-white">Admin Dashboard</h1>
            {address && (
              <div className="text-sm text-gray-300">
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full custom-scrollbar">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
