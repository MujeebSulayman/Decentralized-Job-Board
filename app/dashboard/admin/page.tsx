"use client";

import React, { useEffect, useState } from 'react';
import {
  BriefcaseIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { getAllJobs, getJobApplications } from '@/services/blockchain';
import { JobStruct, ApplicationStruct, JobType, WorkMode, ApplicationState } from '@/utils/type.dt';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

const AdminDashboardPage = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobStruct[]>([]);
  const [applications, setApplications] = useState<ApplicationStruct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Get all jobs
      const allJobs = await getAllJobs();
      setJobs(allJobs);

      // Get all applications
      const allApplications: ApplicationStruct[] = [];
      for (const job of allJobs) {
        try {
          const jobApplications = await getJobApplications(job.id);
          allApplications.push(...jobApplications);
        } catch (error) {
          console.error(`Error fetching applications for job ${job.id}:`, error);
        }
      }

      setApplications(allApplications);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to fetch dashboard data");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Job metrics
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => job.isOpen && !job.expired).length;
  const closedJobs = jobs.filter(job => !job.isOpen && !job.expired).length;
  const expiredJobs = jobs.filter(job => job.expired).length;

  // Application metrics
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => Number(app.currentState) === ApplicationState.PENDING).length;
  const shortlistedApplications = applications.filter(app => Number(app.currentState) === ApplicationState.SHORTLISTED).length;
  const rejectedApplications = applications.filter(app => Number(app.currentState) === ApplicationState.REJECTED).length;
  const hiredApplications = applications.filter(app => Number(app.currentState) === ApplicationState.HIRED).length;

  // Job type distribution
  const fullTimeJobs = jobs.filter(job => job.jobType === JobType.FullTime).length;
  const partTimeJobs = jobs.filter(job => job.jobType === JobType.PartTime).length;
  const internshipJobs = jobs.filter(job => job.jobType === JobType.Internship).length;
  const freelanceJobs = jobs.filter(job => job.jobType === JobType.Freelance).length;
  const contractJobs = jobs.filter(job => job.jobType === JobType.Contract).length;

  // Work mode distribution
  const remoteJobs = jobs.filter(job => job.workMode === WorkMode.Remote).length;
  const onsiteJobs = jobs.filter(job => job.workMode === WorkMode.Onsite).length;
  const hybridJobs = jobs.filter(job => job.workMode === WorkMode.Hybrid).length;

  // Recent activity feed
  const recentJobs = [...jobs]
    .sort((a, b) => Number(b.startTime) - Number(a.startTime))
    .slice(0, 5)
    .map(job => ({
      id: job.id,
      type: 'job',
      title: job.title,
      subTitle: job.orgName,
      timestamp: Number(job.startTime),
      status: job.isOpen ? (job.expired ? 'expired' : 'active') : 'closed'
    }));

  const recentApplications = [...applications]
    .sort((a, b) => Number(b.applicationTimestamp) - Number(a.applicationTimestamp))
    .slice(0, 5)
    .map(app => {
      const job = jobs.find(j => j.id === app.jobId);
      return {
        id: `${app.jobId}-${app.applicant}`,
        type: 'application',
        title: app.name,
        subTitle: job?.title || `Job #${app.jobId}`,
        timestamp: Number(app.applicationTimestamp),
        status: ['pending', 'shortlisted', 'rejected', 'hired'][app.currentState]
      };
    });

  const recentActivity = [...recentJobs, ...recentApplications]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-950">
        <div className="relative">
          <div className="absolute inset-0 h-16 w-16 rounded-full border-t-2 border-b-2 border-purple-500 animate-ping opacity-20"></div>
          <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-purple-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-950">
      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-gray-400">Platform metrics and insights</p>
        </div>
     
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Jobs Card */}
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 shadow-lg hover:shadow-purple-500/5 transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <BriefcaseIcon className="h-7 w-7" />
            </div>
            <span onClick={() => router.push('/dashboard/admin/jobs')} className="text-xs text-purple-400 uppercase tracking-wider font-medium cursor-pointer hover:underline">View All</span>
          </div>
          <h3 className="text-lg text-gray-300 font-medium">Total Jobs</h3>
          <div className="flex justify-between items-end mt-2">
            <p className="text-3xl font-bold text-white">{totalJobs}</p>
            <div className="flex space-x-3 text-sm">
              <div className="flex items-center text-green-400">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span>{activeJobs}</span>
              </div>
              <div className="flex items-center text-yellow-400">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>{closedJobs}</span>
              </div>
              <div className="flex items-center text-red-400">
                <XCircleIcon className="h-4 w-4 mr-1" />
                <span>{expiredJobs}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Card */}
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20 shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <DocumentCheckIcon className="h-7 w-7" />
            </div>
            <span onClick={() => router.push('/dashboard/admin/applications')} className="text-xs text-blue-400 uppercase tracking-wider font-medium cursor-pointer hover:underline">View All</span>
          </div>
          <h3 className="text-lg text-gray-300 font-medium">Applications</h3>
          <div className="flex justify-between items-end mt-2">
            <p className="text-3xl font-bold text-white">{totalApplications}</p>
            <div className="space-y-1">
              <div className="flex justify-between space-x-2 text-sm">
                <div className="flex items-center text-blue-400">
                  <span>Pending:</span>
                </div>
                <span className="text-blue-400">{pendingApplications}</span>
              </div>
              <div className="flex justify-between space-x-2 text-sm">
                <div className="flex items-center text-green-400">
                  <span>Hired:</span>
                </div>
                <span className="text-green-400">{hiredApplications}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Job Types Card */}
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/20 shadow-lg hover:shadow-green-500/5 transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 text-green-400 rounded-lg group-hover:bg-green-500/20 transition-colors">
              <ChartBarIcon className="h-7 w-7" />
            </div>
          </div>
          <h3 className="text-lg text-gray-300 font-medium">Job Types</h3>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Full Time</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden mr-2">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${totalJobs ? (fullTimeJobs / totalJobs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300">{fullTimeJobs}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Part Time</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden mr-2">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${totalJobs ? (partTimeJobs / totalJobs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300">{partTimeJobs}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Contract</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden mr-2">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${totalJobs ? (contractJobs / totalJobs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300">{contractJobs}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Work Modes Card */}
        <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20 shadow-lg hover:shadow-yellow-500/5 transition-all duration-300 group overflow-hidden relative">
          <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
              <BuildingOfficeIcon className="h-7 w-7" />
            </div>
          </div>
          <h3 className="text-lg text-gray-300 font-medium">Work Modes</h3>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Remote</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden mr-2">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${totalJobs ? (remoteJobs / totalJobs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300">{remoteJobs}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Onsite</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden mr-2">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${totalJobs ? (onsiteJobs / totalJobs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300">{onsiteJobs}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Hybrid</span>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden mr-2">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${totalJobs ? (hybridJobs / totalJobs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300">{hybridJobs}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Status */}
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <h3 className="text-lg text-gray-300 font-medium mb-6 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-blue-400" />
            Application Status
          </h3>

          <div className="space-y-4">
            {/* Pending */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Pending</span>
                <span className="text-blue-400 text-sm font-medium">{totalApplications > 0 ? Math.round((pendingApplications / totalApplications) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${totalApplications > 0 ? (pendingApplications / totalApplications) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Shortlisted */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Shortlisted</span>
                <span className="text-yellow-400 text-sm font-medium">{totalApplications > 0 ? Math.round((shortlistedApplications / totalApplications) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all duration-1000"
                  style={{ width: `${totalApplications > 0 ? (shortlistedApplications / totalApplications) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Rejected */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Rejected</span>
                <span className="text-red-400 text-sm font-medium">{totalApplications > 0 ? Math.round((rejectedApplications / totalApplications) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-1000"
                  style={{ width: `${totalApplications > 0 ? (rejectedApplications / totalApplications) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Hired */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Hired</span>
                <span className="text-green-400 text-sm font-medium">{totalApplications > 0 ? Math.round((hiredApplications / totalApplications) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-1000"
                  style={{ width: `${totalApplications > 0 ? (hiredApplications / totalApplications) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <h3 className="text-lg text-gray-300 font-medium mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/dashboard/admin/jobs/create')}
              className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/20 hover:from-purple-800/40 hover:to-purple-700/30 border border-purple-500/20 rounded-xl text-left transition-all duration-300"
            >
              <BriefcaseIcon className="h-6 w-6 text-purple-400 mb-2" />
              <span className="text-white font-medium block mb-1">Post New Job</span>
              <span className="text-gray-400 text-xs">Create a new job listing</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/admin/jobs')}
              className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/20 hover:from-blue-800/40 hover:to-blue-700/30 border border-blue-500/20 rounded-xl text-left transition-all duration-300"
            >
              <ChartBarIcon className="h-6 w-6 text-blue-400 mb-2" />
              <span className="text-white font-medium block mb-1">Manage Jobs</span>
              <span className="text-gray-400 text-xs">View and edit all jobs</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/admin/applications')}
              className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/20 hover:from-green-800/40 hover:to-green-700/30 border border-green-500/20 rounded-xl text-left transition-all duration-300"
            >
              <DocumentCheckIcon className="h-6 w-6 text-green-400 mb-2" />
              <span className="text-white font-medium block mb-1">Applications</span>
              <span className="text-gray-400 text-xs">Review all applications</span>
            </button>

            <button
              onClick={() => router.push('/dashboard/admin/users')}
              className="p-4 bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 hover:from-yellow-800/40 hover:to-yellow-700/30 border border-yellow-500/20 rounded-xl text-left transition-all duration-300"
            >
              <UserIcon className="h-6 w-6 text-yellow-400 mb-2" />
              <span className="text-white font-medium block mb-1">Users</span>
              <span className="text-gray-400 text-xs">Manage platform users</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg">
          <h3 className="text-lg text-gray-300 font-medium mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 bg-gray-800/60 rounded-lg hover:bg-gray-800/90 transition-colors cursor-pointer"
                  onClick={() => {
                    if (activity.type === 'job') {
                      router.push(`/dashboard/admin/jobs/${activity.id}`);
                    } else {
                      router.push(`/dashboard/admin/applications/${activity.id}`);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        {activity.type === 'job' ? (
                          <BriefcaseIcon className="h-4 w-4 text-purple-400 mr-2" />
                        ) : (
                          <UserIcon className="h-4 w-4 text-blue-400 mr-2" />
                        )}
                        <p className="text-sm text-gray-200">
                          {activity.title}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 ml-6">{activity.subTitle}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp * 1000), { addSuffix: true })}
                      </span>
                      <span className={`text-xs mt-1 px-2 py-0.5 rounded-full ${activity.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        activity.status === 'closed' ? 'bg-yellow-500/20 text-yellow-400' :
                          activity.status === 'expired' ? 'bg-red-500/20 text-red-400' :
                            activity.status === 'hired' ? 'bg-green-500/20 text-green-400' :
                              activity.status === 'shortlisted' ? 'bg-yellow-500/20 text-yellow-400' :
                                activity.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                  'bg-blue-500/20 text-blue-400'
                        }`}>
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <ExclamationTriangleIcon className="h-8 w-8 mb-2" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAdminLayout(AdminDashboardPage);