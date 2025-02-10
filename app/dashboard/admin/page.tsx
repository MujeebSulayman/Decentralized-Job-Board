import React from 'react';
import {
  BriefcaseIcon, 
  UserGroupIcon, 
  DocumentCheckIcon, 
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentPlusIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/solid";
import withAdminLayout from '@/components/hoc/withAdminLayout';

// Mock data - in real app, this would come from backend/contract
const dashboardData = {
  jobMetrics: {
    totalJobs: 124,
    activeJobs: 87,
    expiredJobs: 37,
    pendingJobs: 12
  },
  userMetrics: {
    totalUsers: 456,
    verifiedUsers: 342,
    pendingVerification: 114
  },
  financialMetrics: {
    totalRevenue: 45678.90,
    serviceFee: 0.05, // 5%
    pendingPayments: 3456.78
  },
  recentActivity: [
    {
      id: 1,
      type: 'job_posted',
      title: 'Senior Software Engineer',
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      type: 'application_received',
      title: 'Frontend Developer Role',
      timestamp: '1 hour ago'
    },
    {
      id: 3,
      type: 'user_verified',
      title: 'New Employer Verified',
      timestamp: '30 mins ago'
    }
  ]
};

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6 p-6 bg-gray-950 text-white">
      <h1 className="text-3xl font-bold mb-6 text-primary-400">Admin Dashboard</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Job Metrics */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <BriefcaseIcon className="h-8 w-8 text-primary-500" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Job Metrics</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Jobs</span>
              <span className="font-bold text-primary-400">{dashboardData.jobMetrics.totalJobs}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-green-400">
                <DocumentCheckIcon className="h-4 w-4 mr-2" />
                Active Jobs
              </div>
              <span className="font-bold text-green-400">{dashboardData.jobMetrics.activeJobs}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-red-400">
                <ClockIcon className="h-4 w-4 mr-2" />
                Expired Jobs
              </div>
              <span className="font-bold text-red-400">{dashboardData.jobMetrics.expiredJobs}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-yellow-400">
                <DocumentPlusIcon className="h-4 w-4 mr-2" />
                Pending Jobs
              </div>
              <span className="font-bold text-yellow-400">{dashboardData.jobMetrics.pendingJobs}</span>
            </div>
          </div>
        </div>

        {/* User Metrics */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">User Metrics</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Users</span>
              <span className="font-bold text-blue-400">{dashboardData.userMetrics.totalUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-400">Verified Users</span>
              <span className="font-bold text-green-400">{dashboardData.userMetrics.verifiedUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-yellow-400">
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                Pending Verification
              </div>
              <span className="font-bold text-yellow-400">{dashboardData.userMetrics.pendingVerification}</span>
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Financial</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Revenue</span>
              <span className="font-bold text-green-400">${dashboardData.financialMetrics.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Service Fee</span>
              <span className="font-bold text-primary-400">{(dashboardData.financialMetrics.serviceFee * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-yellow-400">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Pending Payments
              </div>
              <span className="font-bold text-yellow-400">${dashboardData.financialMetrics.pendingPayments.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Recent Activity</span>
          </div>
          <div className="space-y-3">
            {dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-200 capitalize">
                      {activity.type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-400">{activity.title}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAdminLayout(AdminDashboardPage);