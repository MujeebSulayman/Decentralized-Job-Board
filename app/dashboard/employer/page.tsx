'use client'

import React, { useEffect, useState } from 'react';
import {
  BriefcaseIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentPlusIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/solid";
import withEmployerlayout from '@/components/hoc/withEmployerlayout';
import { getMyJobs } from '@/services/blockchain';
import { JobStruct } from '@/utils/type.dt';
import { toast } from 'react-toastify';

const EmployerDashboard = () => {
  const [jobs, setJobs] = useState<JobStruct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const myJobs = await getMyJobs();
      setJobs(myJobs);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  // Calculate metrics
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => job.isOpen && !job.expired && !job.deleted).length;
  const expiredJobs = jobs.filter(job => job.expired || job.deleted).length;
  const recentJobs = jobs.slice(0, 3).map(job => ({
    id: job.id,
    title: job.title,
    postedAt: new Date(Number(BigInt(job.startTime) * BigInt(1000))).toLocaleDateString()
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-950 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary-400">Employer Dashboard</h1>
        <button
          onClick={refreshData}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors"
        >
          <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

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
              <span className="font-bold text-primary-400">{totalJobs}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-green-400">
                <DocumentCheckIcon className="h-4 w-4 mr-2" />
                Active Jobs
              </div>
              <span className="font-bold text-green-400">{activeJobs}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-red-400">
                <ClockIcon className="h-4 w-4 mr-2" />
                Expired Jobs
              </div>
              <span className="font-bold text-red-400">{expiredJobs}</span>
            </div>
          </div>
        </div>

        {/* Job Types */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Job Types</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Full Time</span>
              <span className="font-bold text-blue-400">
                {jobs.filter(job => job.jobType === 0).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-400">Part Time</span>
              <span className="font-bold text-green-400">
                {jobs.filter(job => job.jobType === 1).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-yellow-400">
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                Other Types
              </div>
              <span className="font-bold text-yellow-400">
                {jobs.filter(job => job.jobType > 1).length}
              </span>
            </div>
          </div>
        </div>

        {/* Work Modes */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <ChartBarIcon className="h-8 w-8 text-green-500" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Work Modes</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Remote</span>
              <span className="font-bold text-green-400">
                {jobs.filter(job => job.workMode === 0).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Onsite</span>
              <span className="font-bold text-primary-400">
                {jobs.filter(job => job.workMode === 1).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center text-yellow-400">
                <DocumentPlusIcon className="h-4 w-4 mr-2" />
                Hybrid
              </div>
              <span className="font-bold text-yellow-400">
                {jobs.filter(job => job.workMode === 2).length}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <DocumentCheckIcon className="h-8 w-8 text-purple-500" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Recent Jobs</span>
          </div>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-200">{job.title}</p>
                    <p className="text-xs text-gray-400">Posted: {job.postedAt}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {jobs.find(j => j.id === job.id)?.isOpen ? 'Active' : 'Closed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withEmployerlayout(EmployerDashboard);