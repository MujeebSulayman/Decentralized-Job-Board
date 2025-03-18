"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { getMyJobs, closeJob } from "@/services/blockchain";
import { JobStruct } from "@/utils/type.dt";
import Image from "next/image";
import withEmployerlayout from '@/components/hoc/withEmployerlayout';
import { formatDistanceToNow } from "date-fns";
import { getIPFSGatewayUrl } from "@/utils/ipfsUpload";
import {
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  FunnelIcon,
  ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";

interface ModalProps {
  isOpen: boolean;
  action: 'close' | null;
  jobId: number | null;
  jobTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

type StatusFilter = 'all' | 'active' | 'closed' | 'expired';

const JobManagementPage = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobStruct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [modal, setModal] = useState<ModalProps>({
    isOpen: false,
    action: null,
    jobId: null,
    jobTitle: '',
    onConfirm: () => { },
    onCancel: () => { }
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const myJobs = await getMyJobs();
      const formattedJobs = myJobs.map(job => ({
        ...job,
        id: Number(job.id),
        startTime: Number(job.startTime),
        endTime: Number(job.endTime),
        expirationTime: Number(job.expirationTime),
        isOpen: Boolean(Number(job.isOpen)),
        expired: Boolean(Number(job.expired)),
        minimumSalary: job.minimumSalary.toString(),
        maximumSalary: job.maximumSalary.toString(),
        logoCID: job.logoCID,
        title: job.title,
        orgName: job.orgName
      }));

      setJobs(formattedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const handleCloseJob = async (e: React.MouseEvent, jobId: number, jobTitle: string) => {
    e.stopPropagation(); // Prevent card click
    setModal({
      isOpen: true,
      action: 'close',
      jobId,
      jobTitle,
      onConfirm: async () => {
        setActionLoading(jobId);
        try {
          await closeJob(jobId);
          toast.success("Job closed successfully");
          fetchJobs();
        } catch (error) {
          console.error("Error closing job:", error);
          toast.error("Failed to close job");
        } finally {
          setActionLoading(null);
          setModal(prev => ({ ...prev, isOpen: false }));
        }
      },
      onCancel: () => setModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Navigate to job details when card is clicked
  const handleJobClick = (jobId: number) => {
    router.push(`/dashboard/employer/jobs/${jobId}`);
  };

  // Navigate to job applications
  const handleViewApplications = (e: React.MouseEvent, jobId: number) => {
    e.stopPropagation(); // Prevent card click
    router.push(`/dashboard/employer/applications/jobs/${jobId}`);
  };

  const getStatusBadge = (job: JobStruct) => {
    if (job.expired) {
      return (
        <div className="flex items-center text-red-400 bg-red-500/10 px-3 py-1 rounded-full text-xs font-medium">
          <XCircleIcon className="h-4 w-4 mr-1" />
          Expired
        </div>
      );
    }
    if (!job.isOpen) {
      return (
        <div className="flex items-center text-gray-400 bg-gray-500/10 px-3 py-1 rounded-full text-xs font-medium">
          <ClockIcon className="h-4 w-4 mr-1" />
          Closed
        </div>
      );
    }
    return (
      <div className="flex items-center text-green-400 bg-green-500/10 px-3 py-1 rounded-full text-xs font-medium">
        <CheckCircleIcon className="h-4 w-4 mr-1" />
        Active
      </div>
    );
  };

  // Filter jobs based on status
  const filteredJobs = jobs.filter(job => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return job.isOpen && !job.expired;
    if (statusFilter === 'closed') return !job.isOpen && !job.expired;
    if (statusFilter === 'expired') return job.expired;
    return true;
  });

  const ConfirmationModal = ({ isOpen, action, jobTitle, onConfirm, onCancel }: ModalProps) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700 shadow-xl">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">
            Close Job
          </h3>
          <p className="text-gray-300 mb-6">
            Are you sure you want to close "{jobTitle}"? This will prevent new applications.
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg transition-colors duration-200 flex items-center bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
            >
              {actionLoading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Working...
                </>
              ) : (
                'Close'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Status filter tabs
  const FilterTabs = () => {
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${statusFilter === 'all'
            ? 'bg-purple-500 text-white'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
        >
          All Jobs
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center ${statusFilter === 'active'
            ? 'bg-green-500/30 text-green-300'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
        >
          <CheckCircleIcon className="h-4 w-4 mr-1.5" />
          Active
        </button>
        <button
          onClick={() => setStatusFilter('closed')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center ${statusFilter === 'closed'
            ? 'bg-yellow-500/30 text-yellow-300'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
        >
          <ClockIcon className="h-4 w-4 mr-1.5" />
          Closed
        </button>
        <button
          onClick={() => setStatusFilter('expired')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center ${statusFilter === 'expired'
            ? 'bg-red-500/30 text-red-300'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
        >
          <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
          Expired
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Jobs</h1>
          <p className="text-gray-400 mt-1">View, edit, and manage your job postings</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button
            onClick={() => router.push("/dashboard/employer/jobs/create")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Post New Job
          </button>
        </div>
      </div>

      <FilterTabs />

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-lg border border-gray-800 bg-gray-900/50">
          <div className="mx-auto h-24 w-24 text-gray-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-200 mb-2">No jobs found</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {statusFilter === 'all'
              ? "You haven't posted any jobs yet. Click the button below to create your first job posting."
              : `You don't have any ${statusFilter} jobs. Adjust your filter to see other job statuses.`}
          </p>
          {statusFilter === 'all' && (
            <button
              onClick={() => router.push('/dashboard/employer/post')}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Post Your First Job
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => handleJobClick(job.id)}
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden hover:shadow-lg hover:border-gray-600/50 transition-all duration-200 cursor-pointer"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-lg bg-gray-700/50 flex items-center justify-center mr-3 overflow-hidden">
                      {job.logoCID ? (
                        <img
                          src={getIPFSGatewayUrl(job.logoCID)}
                          alt={job.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=' + job.title.charAt(0);
                          }}
                        />
                      ) : (
                        <span className="text-gray-400 text-lg font-semibold">
                          {job.title.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-white">{job.title}</h3>
                      <p className="text-gray-400 text-sm">{job.orgName}</p>
                    </div>
                  </div>
                  {getStatusBadge(job)}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-300">
                      ${job.minimumSalary} - ${job.maximumSalary}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CalendarIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-400">
                      Posted {formatDistanceToNow(new Date(job.startTime * 1000), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-700/30 pt-4 flex space-x-2">
                  <button
                    onClick={(e) => handleViewApplications(e, job.id)}
                    className="flex flex-1 items-center justify-center px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg text-purple-400 transition-colors"
                  >
                    <ClipboardDocumentCheckIcon className="h-5 w-5 mr-1.5" />
                    View Applications
                  </button>

                  {job.isOpen && !job.expired && (
                    <button
                      onClick={(e) => handleCloseJob(e, job.id, job.title)}
                      className="flex items-center justify-center px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg text-yellow-400 transition-colors"
                      disabled={actionLoading === job.id}
                    >
                      {actionLoading === job.id ? (
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      ) : (
                        <ClockIcon className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal {...modal} />
    </div>
  );
};

export default withEmployerlayout(JobManagementPage);
