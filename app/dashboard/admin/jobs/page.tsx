"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { getAllJobs, deleteJob, closeJob } from "@/services/blockchain";
import { JobStruct } from "@/utils/type.dt";
import Image from "next/image";
import withAdminLayout from "@/components/hoc/withAdminLayout";
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
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";

interface ModalProps {
  isOpen: boolean;
  action: 'close' | 'delete' | null;
  jobId: number | null;
  jobTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

type StatusFilter = 'all' | 'active' | 'closed' | 'expired';

const JobsPage = () => {
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
      const allJobs = await getAllJobs();
      const formattedJobs = allJobs.map(job => ({
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

  const handleDeleteJob = async (e: React.MouseEvent, jobId: number, jobTitle: string) => {
    e.stopPropagation(); // Prevent card click
    setModal({
      isOpen: true,
      action: 'delete',
      jobId,
      jobTitle,
      onConfirm: async () => {
        setActionLoading(jobId);
        try {
          await deleteJob(jobId);
          toast.success("Job deleted successfully");
          fetchJobs();
        } catch (error) {
          console.error("Error deleting job:", error);
          toast.error("Failed to delete job");
        } finally {
          setActionLoading(null);
          setModal(prev => ({ ...prev, isOpen: false }));
        }
      },
      onCancel: () => setModal(prev => ({ ...prev, isOpen: false }))
    });
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
    router.push(`/dashboard/admin/jobs/${jobId}`);
  };

  // Navigate to job applications
  const handleViewApplications = (e: React.MouseEvent, jobId: number) => {
    e.stopPropagation(); // Prevent card click
    router.push(`/dashboard/admin/applications/jobs/${jobId}`);
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
            {action === 'delete' ? 'Delete Job' : 'Close Job'}
          </h3>
          <p className="text-gray-300 mb-6">
            {action === 'delete'
              ? `Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`
              : `Are you sure you want to close "${jobTitle}"? This will prevent new applications.`
            }
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
              className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center ${action === 'delete'
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                }`}
            >
              {actionLoading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Working...
                </>
              ) : (
                action === 'delete' ? 'Delete' : 'Close'
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
          <XCircleIcon className="h-4 w-4 mr-1.5" />
          Expired
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Job Listings</h1>
          <p className="text-gray-400 text-sm">{filteredJobs.length} of {jobs.length} jobs shown</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push("/dashboard/admin/jobs/create")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Post New Job
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-gray-300 font-medium">Filter Jobs</h3>
        </div>
        <FilterTabs />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className={`bg-gray-800/50 rounded-lg p-4 border border-green-500/20 cursor-pointer transition-all duration-200 ${statusFilter === 'active' ? 'ring-2 ring-green-500' : 'hover:border-green-500/40'}`}
          onClick={() => setStatusFilter('active')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium">Active Jobs</h3>
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {jobs.filter(job => job.isOpen && !job.expired).length}
          </p>
        </div>

        <div
          className={`bg-gray-800/50 rounded-lg p-4 border border-yellow-500/20 cursor-pointer transition-all duration-200 ${statusFilter === 'closed' ? 'ring-2 ring-yellow-500' : 'hover:border-yellow-500/40'}`}
          onClick={() => setStatusFilter('closed')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium">Closed Jobs</h3>
            <ClockIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {jobs.filter(job => !job.isOpen && !job.expired).length}
          </p>
        </div>

        <div
          className={`bg-gray-800/50 rounded-lg p-4 border border-red-500/20 cursor-pointer transition-all duration-200 ${statusFilter === 'expired' ? 'ring-2 ring-red-500' : 'hover:border-red-500/40'}`}
          onClick={() => setStatusFilter('expired')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium">Expired Jobs</h3>
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {jobs.filter(job => job.expired).length}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-gray-800/50 rounded-lg p-8 text-center border border-gray-700">
          <div className="flex justify-center mb-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Jobs Found</h3>
          <p className="text-gray-400 mb-6">
            {statusFilter !== 'all'
              ? `No ${statusFilter} jobs available. Try changing your filter.`
              : 'Start by posting your first job listing'}
          </p>
          {statusFilter !== 'all' ? (
            <button
              onClick={() => setStatusFilter('all')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 inline-flex items-center"
            >
              Show All Jobs
            </button>
          ) : (
            <button
              onClick={() => router.push("/dashboard/admin/jobs/create")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Job
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => handleJobClick(job.id)}
              className="bg-gray-800/50 rounded-lg overflow-hidden border border-purple-500/20 hover:border-purple-500/40 hover:bg-gray-800/70 transition-all duration-200 flex flex-col cursor-pointer group"
            >
              <div className="p-5">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="h-16 w-16 flex-shrink-0 bg-gray-700 rounded-lg overflow-hidden relative">
                    {job.logoCID ? (
                      <Image
                        src={getIPFSGatewayUrl(job.logoCID)}
                        alt={job.orgName}
                        fill
                        className="object-contain"
                        sizes="64px"
                        priority
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.png';
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-500">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-100 text-lg mb-1 line-clamp-2 group-hover:text-purple-300 transition-colors">{job.title}</h3>
                      {getStatusBadge(job)}
                    </div>
                    <p className="text-sm text-gray-400">{job.orgName}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Posted {formatDistanceToNow(new Date(job.startTime * 1000), { addSuffix: true })}
                    </span>
                  </div>
                  {(job.minimumSalary || job.maximumSalary) && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <CurrencyDollarIcon className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {`${job.minimumSalary} - ${job.maximumSalary}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-3 border-t border-gray-700 bg-gray-800/80 p-3 flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/admin/jobs/${job.id}`);
                  }}
                  className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded transition-colors duration-200 flex items-center"
                  title="View Details"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>

                <button
                  onClick={(e) => handleViewApplications(e, job.id)}
                  className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded transition-colors duration-200 flex items-center"
                  title="View Applications"
                >
                  <ClipboardDocumentCheckIcon className="h-4 w-4" />
                </button>

                {job.isOpen && !job.expired && (
                  <button
                    onClick={(e) => handleCloseJob(e, job.id, job.title)}
                    disabled={actionLoading === job.id}
                    className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded transition-colors duration-200 disabled:opacity-50 flex items-center"
                    title="Close Job"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDeleteJob(e, job.id, job.title)}
                  disabled={actionLoading === job.id}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors duration-200 disabled:opacity-50 flex items-center"
                  title="Delete Job"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal {...modal} />
    </div>
  );
};

export default withAdminLayout(JobsPage);