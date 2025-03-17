"use client";

import { useEffect, useState } from "react";
import { getMyJobs, getJobApplications, updateApplicationStatus } from "@/services/blockchain";
import { ApplicationState, ApplicationStruct, JobStruct } from "@/utils/type.dt";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";
import withEmployerlayout from "@/components/hoc/withEmployerlayout";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  EyeIcon,
  ArrowPathIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { getIPFSGatewayUrl } from "@/utils/ipfsUpload";
import { useRouter } from "next/navigation";

function EmployerApplicationsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobStruct[]>([]);
  const [applications, setApplications] = useState<ApplicationStruct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(true);

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
      const myJobs = await getMyJobs();
      setJobs(myJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs");
    }
  };

  const fetchAllApplications = async () => {
    try {
      const allApplications: ApplicationStruct[] = [];
      for (const job of jobs) {
        try {
          const jobApplications = await getJobApplications(job.id);
          allApplications.push(...jobApplications);
        } catch (error) {
          console.error(`Error fetching applications for job ${job.id}:`, error);
        }
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

  const getStatusColor = (status: ApplicationState) => {
    switch (status) {
      case ApplicationState.PENDING:
        return 'bg-blue-500/20 text-blue-400';
      case ApplicationState.SHORTLISTED:
        return 'bg-yellow-500/20 text-yellow-400';
      case ApplicationState.REJECTED:
        return 'bg-red-500/20 text-red-400';
      case ApplicationState.HIRED:
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleContactApplicant = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const handleViewCV = (cvCID: string) => {
    window.open(getIPFSGatewayUrl(cvCID), '_blank');
  };

  const handleViewApplication = (jobId: number, applicantAddress: string) => {
    router.push(`/dashboard/employer/applications/${jobId}-${applicantAddress}`);
  };

  // Helper function to safely get application state string
  const safeGetApplicationState = (state: number): string => {
    if (state === undefined || state < 0 || state > 3) {
      return `Status ${state}`;
    }
    return ApplicationState[state];
  };

  const filteredApplications = applications.filter((app) => {
    // Add null checks for all properties before accessing them
    if (!app || !app.name || !app.email) {
      return false;
    }

    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      Number(app.currentState) === Number(statusFilter);

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalApplications = applications.length;
  const pendingCount = applications.filter(app => app.currentState === ApplicationState.PENDING).length;
  const shortlistedCount = applications.filter(app => app.currentState === ApplicationState.SHORTLISTED).length;
  const rejectedCount = applications.filter(app => app.currentState === ApplicationState.REJECTED).length;
  const hiredCount = applications.filter(app => app.currentState === ApplicationState.HIRED).length;

  const refreshData = async () => {
    setRefreshing(true);
    await fetchJobs();
    await fetchAllApplications();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Job Applications</h1>
          <p className="text-gray-400 mt-1">
            View and manage applications for your job postings
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-900/30 border border-blue-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Pending</p>
              <h3 className="text-white text-2xl font-bold mt-1">{pendingCount}</h3>
            </div>
            <div className="h-12 w-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-blue-400 text-xl font-bold">{Math.round((pendingCount / totalApplications) * 100) || 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">Shortlisted</p>
              <h3 className="text-white text-2xl font-bold mt-1">{shortlistedCount}</h3>
            </div>
            <div className="h-12 w-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <span className="text-yellow-400 text-xl font-bold">{Math.round((shortlistedCount / totalApplications) * 100) || 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-red-900/30 border border-red-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm font-medium">Rejected</p>
              <h3 className="text-white text-2xl font-bold mt-1">{rejectedCount}</h3>
            </div>
            <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-red-400 text-xl font-bold">{Math.round((rejectedCount / totalApplications) * 100) || 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-green-900/30 border border-green-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Hired</p>
              <h3 className="text-white text-2xl font-bold mt-1">{hiredCount}</h3>
            </div>
            <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-green-400 text-xl font-bold">{Math.round((hiredCount / totalApplications) * 100) || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/30 rounded-lg shadow-md p-6 border border-gray-700/50 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-400 hover:text-white"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            <ChevronDownIcon className={`ml-1 h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="mb-4 flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, location, or phone..."
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
                <option value="0">Pending</option>
                <option value="1">Shortlisted</option>
                <option value="2">Rejected</option>
                <option value="3">Hired</option>
              </select>
              <AdjustmentsHorizontalIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {filteredApplications.length === 0 && (
          <div className="bg-gray-900/30 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-2">No applications found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters or search criteria</p>
          </div>
        )}
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
                  <tr
                    key={`${application.jobId}-${application.applicant}`}
                    className="hover:bg-gray-700/30 transition-colors cursor-pointer"
                    onClick={() => handleViewApplication(application.jobId, application.applicant)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-green-900/30 rounded-full flex items-center justify-center border border-green-500/30">
                          <span className="text-green-400 font-medium text-sm">
                            {application.name && application.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{application.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-400">{application.location || 'Unknown location'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {job?.logoCID && (
                          <div className="flex-shrink-0 h-8 w-8 mr-3">
                            <img
                              src={getIPFSGatewayUrl(job.logoCID)}
                              alt={job.title || 'Job'}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          </div>
                        )}
                        <div className="text-sm text-white">{job?.title || "Unknown Job"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{application.email || 'No email'}</div>
                      <div className="text-sm text-gray-400">{application.phoneNumber || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDistanceToNow(
                        new Date(Number(BigInt(application.applicationTimestamp) * BigInt(1000))),
                        { addSuffix: true }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.currentState)}`}>
                        {safeGetApplicationState(application.currentState)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewApplication(application.jobId, application.applicant)}
                          className="p-1.5 bg-purple-500/20 text-purple-400 rounded-md hover:bg-purple-500/30 transition-colors"
                          title="View Application"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleViewCV(application.cvCID)}
                          className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors"
                          title="View CV"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleContactApplicant(application.email)}
                          className="p-1.5 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-colors"
                          title="Contact Applicant"
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                        </button>

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
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="0">Pending</option>
                          <option value="1">Shortlisted</option>
                          <option value="2">Rejected</option>
                          <option value="3">Hired</option>
                        </select>
                      </div>
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
  );
}

export default withEmployerlayout(EmployerApplicationsPage);
