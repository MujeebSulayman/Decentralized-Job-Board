"use client";

import React, { useState } from "react";
import {
  HomeIcon,
  ChartBarIcon,
  BriefcaseIcon,
  DocumentPlusIcon,
  PencilSquareIcon,
  UserGroupIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  CogIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  CodeBracketIcon,
  ClockIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/solid";
import { useAccount, useDisconnect } from "wagmi";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-toastify";
import clsx from "clsx";

// Enhanced Role-Based Navigation
enum AdminRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  JOB_MANAGER = "JOB_MANAGER",
  USER_MANAGER = "USER_MANAGER",
  FINANCIAL_ADMIN = "FINANCIAL_ADMIN",
}

interface NavItem {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
  group?: string;
  requiredRoles?: AdminRole[];
}

const AdminDashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole>(AdminRole.SUPER_ADMIN);

  // Dashboard Metrics Inspired by Smart Contract
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalJobs: 124,
    totalApplications: 456,
    serviceFee: 0.05, // 5%
    activeJobs: 87,
    expiredJobs: 37,
  });

  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const pathname = usePathname();

  // Comprehensive Navigation Sections with Role-Based Access
  const navItems: NavItem[] = [
    {
      text: "Dashboard Overview",
      icon: HomeIcon,
      path: "/dashboard/admin",
      group: "Overview",
      requiredRoles: [AdminRole.SUPER_ADMIN],
    },
    {
      text: "Job Analytics",
      icon: ChartBarIcon,
      path: "/dashboard/admin/analytics",
      badge: 3,
      group: "Overview",
      requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.JOB_MANAGER],
    },
    {
      text: "Job Dashboard",
      icon: BriefcaseIcon,
      path: "/dashboard/admin/jobs",
      group: "Jobs Management",
      requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.JOB_MANAGER],
    },
    {
      text: "Post New Job",
      icon: DocumentPlusIcon,
      path: "/dashboard/admin/jobs/create",
      group: "Jobs Management",
      requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.JOB_MANAGER],
    },
    {
      text: "Manage Jobs",
      icon: PencilSquareIcon,
      path: "/dashboard/admin/jobs/manage",
      group: "Jobs Management",
      requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.JOB_MANAGER],
    },
    {
      text: "User List",
      icon: UserGroupIcon,
      path: "/dashboard/admin/users",
      group: "User Management",
      requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.USER_MANAGER],
    },
    {
      text: "Add User",
      icon: UserPlusIcon,
      path: "/dashboard/admin/users/create",
      group: "User Management",
      requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.USER_MANAGER],
    },
    {
      text: "Role Management",
      icon: ShieldCheckIcon,
      path: "/dashboard/admin/users/roles",
      group: "User Management",
      requiredRoles: [AdminRole.SUPER_ADMIN],
    },
    {
      text: "Financial Settings",
      icon: CurrencyDollarIcon,
      path: "/dashboard/admin/settings/financial",
      group: "Configuration",
      requiredRoles: [AdminRole.SUPER_ADMIN, AdminRole.FINANCIAL_ADMIN],
    },
    {
      text: "System Health",
      icon: ExclamationTriangleIcon,
      path: "/dashboard/admin/system-health",
      badge: 2,
      group: "Configuration",
      requiredRoles: [AdminRole.SUPER_ADMIN],
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    disconnect();
    toast.success("Logged out successfully", {
      theme: "dark",
      position: "bottom-right",
    });
    router.push("/");
  };

  // Filter navigation based on admin role
  const filteredNavItems = navItems.filter(
    (item) => !item.requiredRoles || item.requiredRoles.includes(adminRole)
  );

  // Group navigation items
  const groupedNavItems = filteredNavItems.reduce((acc, item) => {
    if (!acc[item.group!]) {
      acc[item.group!] = [];
    }
    acc[item.group!].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const Sidebar = () => (
    <div className="bg-black/90 text-white w-64 h-full flex flex-col 
      overflow-y-auto 
      scrollbar-thin 
      scrollbar-track-gray-800 
      scrollbar-thumb-green-100 
      hover:scrollbar-thumb-green-100 
      scrollbar-thumb-rounded-full
      border-r border-gray-800/30">
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
          <div className="text-xs text-gray-400">Applications</div>
          <div className="text-lg font-bold text-white">
            {dashboardMetrics.totalApplications}
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
      </div>

      {/* Navigation (Scrollable) */}
      <nav className="flex-grow">
        <div className="space-y-6 px-4 py-6">
          {Object.entries(groupedNavItems).map(([group, items]) => (
            <div key={group}>
              <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-800/30 pb-2">
                {group}
              </h3>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.path}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={clsx(
                        "w-full flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 text-left",
                        pathname === item.path 
                          ? "bg-green-500/20 text-green-400" 
                          : "text-gray-300 hover:bg-gray-800/30 hover:text-white",
                        "group relative"
                      )}
                    >
                      <item.icon
                        className={clsx(
                          "w-5 h-5 mr-3 flex-shrink-0",
                          pathname === item.path
                            ? "text-green-400"
                            : "text-gray-400 group-hover:text-white"
                        )}
                      />
                      <span className="text-sm font-medium flex-grow truncate">
                        {item.text}
                      </span>
                      {item.badge && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
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
            {adminRole.replace('_', ' ')}
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
    <div className="flex min-h-screen bg-black/95 text-white">
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
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-black/90">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
