import React, { useState, useEffect } from "react";
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
} from "@heroicons/react/24/solid";
import { useAccount, useDisconnect } from "wagmi";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import clsx from "clsx";
import Link from "next/link";

interface NavItem {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const AdminDashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const navSections: NavSection[] = [
    {
      title: "Dashboard Overview",
      items: [
        {
          text: "Home",
          icon: HomeIcon,
          path: "/dashboard/admin",
        },
        {
          text: "Analytics",
          icon: ChartBarIcon,
          path: "/dashboard/admin/analytics",
          badge: 3,
        },
      ],
    },
    {
      title: "Job Management",
      items: [
        {
          text: "Job Dashboard",
          icon: BriefcaseIcon,
          path: "/dashboard/admin/jobs",
        },
        {
          text: "Post New Job",
          icon: DocumentPlusIcon,
          path: "/dashboard/admin/jobs/create",
        },
        {
          text: "Manage Jobs",
          icon: PencilSquareIcon,
          path: "/dashboard/admin/jobs/manage",
        },
      ],
    },
    {
      title: "User Management",
      items: [
        {
          text: "User List",
          icon: UserGroupIcon,
          path: "/dashboard/admin/users",
        },
        {
          text: "Add User",
          icon: UserPlusIcon,
          path: "/dashboard/admin/users/create",
        },
        {
          text: "Role Management",
          icon: ShieldCheckIcon,
          path: "/dashboard/admin/users/roles",
        },
      ],
    },
    {
      title: "Platform Configuration",
      items: [
        {
          text: "General Settings",
          icon: CogIcon,
          path: "/dashboard/admin/settings",
        },
        {
          text: "Financial Settings",
          icon: CurrencyDollarIcon,
          path: "/dashboard/admin/settings/financial",
        },
        {
          text: "System Health",
          icon: ExclamationTriangleIcon,
          path: "/dashboard/admin/system-health",
          badge: 2,
        },
      ],
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    disconnect();
    toast.success("Logged out successfully");
    router.push("/");
  };

  const renderNavItems = (section: NavSection) => (
    <div key={section.title} className="mb-4">
      <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {section.title}
      </h3>
      <ul className="space-y-2 mt-2">
        {section.items.map((item) => (
          <li key={item.path} className="relative">
            <button
              onClick={() => handleNavigation(item.path)}
              className={clsx(
                "flex items-center w-full p-2 rounded-lg transition-colors duration-200",
                router.pathname === item.path
                  ? "bg-primary-100 text-primary-600"
                  : "hover:bg-gray-100 text-gray-700"
              )}
            >
              <item.icon className="w-6 h-6 mr-3" />
              <span className="text-sm font-medium flex-grow">{item.text}</span>
              {item.badge && (
                <span className="ml-auto inline-block px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const drawerContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center">
        <div className="flex-shrink-0">
          <img
            className="h-10 w-10 rounded-full"
            src="/logo.png"
            alt="Admin Logo"
          />
        </div>
        <div className="ml-3">
          <div className="text-base font-medium text-gray-800">
            Admin Dashboard
          </div>
          <div className="text-sm text-gray-500 truncate">
            {address
              ? `${address.slice(0, 6)}...${address.slice(-4)}`
              : "Not Connected"}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 bg-white overflow-y-auto">
        {navSections.map(renderNavItems)}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <ArrowRightStartOnRectangleIcon className="w-6 h-6 mr-3" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute inset-0 bg-gray-600 opacity-50"
            aria-hidden="true"
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            {drawerContent}
          </div>
        </div>
      )}

      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 pt-5 pb-4 bg-white">
          {drawerContent}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="lg:hidden">
          <div className="bg-primary-600 py-2 px-4 flex items-center justify-between sm:px-6 lg:px-8">
            <button onClick={() => setMobileOpen(true)}>
              <Bars3Icon className="h-6 w-6 text-white" />
            </button>
            <h1 className="text-lg font-medium text-white">Admin Dashboard</h1>
            {address && (
              <div className="text-sm text-white">
                {`${address.slice(0, 6)}...${address.slice(-4)}`}
              </div>
            )}
          </div>
        </div>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
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
