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

interface ModalProps {
  isOpen: boolean;
  action: 'close' | 'delete' | null;
  jobId: number | null;
  jobTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const JobsPage = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobStruct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
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

      console.log("Formatted jobs:", formattedJobs);
      setJobs(formattedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: number, jobTitle: string) => {
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

  const handleCloseJob = async (jobId: number, jobTitle: string) => {
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

  const getStatusBadge = (job: JobStruct) => {
    console.log("Job status:", {
      id: job.id,
      isOpen: job.isOpen,
      expired: job.expired,
      startTime: new Date(job.startTime * 1000).toLocaleString(),
      expirationTime: new Date(job.expirationTime * 1000).toLocaleString()
    });

    if (job.expired) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Expired</span>;
    }
    if (!job.isOpen) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">Closed</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Active</span>;
  };

  const ConfirmationModal = ({ isOpen, action, jobTitle, onConfirm, onCancel }: ModalProps) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
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
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${action === 'delete'
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                  : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                }`}
            >
              {action === 'delete' ? 'Delete' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Job Listings</h1>
        <button
          onClick={() => router.push("/dashboard/admin/jobs/create")}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Post New Job</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No jobs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-gray-800/50 rounded-lg p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative h-12 w-12">
                    {job.logoCID ? (
                      <Image
                        src={getIPFSGatewayUrl(job.logoCID)}
                        alt={job.orgName}
                        fill
                        className="rounded-lg object-cover"
                        sizes="(max-width: 48px) 100vw, 48px"
                        priority
                        onError={(e) => {
                          console.error("Image load error for job:", job.id);
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.png';
                        }}
                      />
                    ) : (
                      <Image
                        src="/placeholder-image.png"
                        alt="Placeholder"
                        fill
                        className="rounded-lg object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100 text-lg">{job.title}</h3>
                    <p className="text-sm text-gray-400">{job.orgName}</p>
                  </div>
                </div>
                {getStatusBadge(job)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    Posted {formatDistanceToNow(new Date(job.startTime * 1000), { addSuffix: true })}
                  </span>
                </div>
                {(job.minimumSalary || job.maximumSalary) && (
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>
                      {`${job.minimumSalary} - ${job.maximumSalary}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => router.push(`/dashboard/admin/jobs/${job.id}`)}
                  className="px-3 py-1.5 text-sm bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded transition-colors duration-200"
                >
                  View Details
                </button>
                {job.isOpen && !job.expired && (
                  <button
                    onClick={() => handleCloseJob(job.id, job.title)}
                    disabled={actionLoading === job.id}
                    className="px-3 py-1.5 text-sm bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded transition-colors duration-200 disabled:opacity-50"
                  >
                    Close
                  </button>
                )}
                <button
                  onClick={() => handleDeleteJob(job.id, job.title)}
                  disabled={actionLoading === job.id}
                  className="px-3 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors duration-200 disabled:opacity-50"
                >
                  Delete
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