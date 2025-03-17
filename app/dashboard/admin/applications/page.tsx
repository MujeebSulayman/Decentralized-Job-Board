"use client";

import { useEffect, useState } from "react";
import {
  getAllJobs,
  getJobApplications,
  updateApplicationStatus,
} from "@/services/blockchain";
import { ApplicationState, ApplicationStruct, JobStruct } from "@/utils/type.dt";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";
import withAdminLayout from "@/components/hoc/withAdminLayout";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { getIPFSGatewayUrl } from "@/utils/ipfsUpload";

function AdminApplicationsPage() {
  const [jobs, setJobs] = useState<JobStruct[]>([]);
  const [applications, setApplications] = useState<ApplicationStruct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<string>("all");

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (jobs.length > 0) {
      fetchAllApplications();
    }
  }, [jobs]);

  const fetchJobs = async () => {
    try {
      const allJobs = await getAllJobs();
      setJobs(allJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs");
    }
  };

  const fetchAllApplications = async () => {
    try {
      const allApplications: ApplicationStruct[] = [];
      for (const job of jobs) {
        const jobApplications = await getJobApplications(job.id);
        allApplications.push(...jobApplications);
      }
      setApplications(allApplications);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast.error("Failed to fetch applications");
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    jobId: number,
    applicant: string,
    newStatus: ApplicationState
  ) => {
    try {
      await updateApplicationStatus(jobId, applicant, newStatus);
      toast.success("Application status updated successfully");
      fetchAllApplications(); // Refresh applications
    } catch (error) {
      console.error("Error updating application status:", error);
      toast.error("Failed to update application status");
    }
  };

  const getStatusBadgeColor = (status: ApplicationState) => {
    switch (status) {
      case ApplicationState.Submitted:
        return "bg-blue-500 text-white";
      case ApplicationState.Reviewed:
        return "bg-yellow-500 text-white";
      case ApplicationState.EmailSent:
        return "bg-green-500 text-white";
      case ApplicationState.Closed:
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      app.currentState === parseInt(statusFilter);
    const matchesJob =
      selectedJob === "all" ||
      app.jobId.toString() === selectedJob;
    return matchesSearch && matchesStatus && matchesJob;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Applications Management</h1>
        <p className="text-gray-400 mt-1">
          View and manage all job applications across the platform
        </p>
      </div>

      <div className="bg-gray-800/30 rounded-lg shadow-md p-6 border border-gray-700/50">
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
            />
          </div>

          <div className="relative min-w-[180px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none bg-gray-900/50 border border-gray-700 rounded-md py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
            >
              <option value="all">All Statuses</option>
              <option value="0">Submitted</option>
              <option value="1">Reviewed</option>
              <option value="2">Email Sent</option>
              <option value="3">Closed</option>
            </select>
            <AdjustmentsHorizontalIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative min-w-[200px]">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full appearance-none bg-gray-900/50 border border-gray-700 rounded-md py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
            >
              <option value="all">All Jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id.toString()}>
                  {job.title}
                </option>
              ))}
            </select>
            <AdjustmentsHorizontalIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Applicant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Job
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Applied
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/20 divide-y divide-gray-700">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((application) => {
                  const job = jobs.find((j) => j.id === application.jobId);
                  return (
                    <tr key={`${application.jobId}-${application.applicant}`} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-green-900/30 rounded-full flex items-center justify-center border border-green-500/30">
                            <span className="text-green-400 font-medium text-sm">
                              {application.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{application.name}</div>
                            <div className="text-sm text-gray-400">{application.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {job?.logoCID && (
                            <div className="flex-shrink-0 h-8 w-8 mr-3">
                              <img
                                src={getIPFSGatewayUrl(job.logoCID)}
                                alt={job.title}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            </div>
                          )}
                          <div className="text-sm text-white">{job?.title || "Unknown Job"}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{application.email}</div>
                        <div className="text-sm text-gray-400">{application.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDistanceToNow(
                          new Date(Number(application.applicationTimestamp) * 1000),
                          { addSuffix: true }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(application.currentState)}`}>
                          {ApplicationState[application.currentState]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={application.currentState.toString()}
                          onChange={(e) =>
                            handleUpdateStatus(
                              application.jobId,
                              application.applicant,
                              parseInt(e.target.value)
                            )
                          }
                          className="bg-gray-900 border border-gray-700 rounded-md py-1 pl-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                        >
                          <option value="0">Submitted</option>
                          <option value="1">Reviewed</option>
                          <option value="2">Email Sent</option>
                          <option value="3">Closed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-400">
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default withAdminLayout(AdminApplicationsPage);