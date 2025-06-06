"use client";

import { useEffect, useState } from "react";
import { getJob, getJobApplications, updateApplicationStatus } from "@/services/blockchain";
import { ApplicationState, ApplicationStruct, JobStruct } from "@/utils/type.dt";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";
import withAdminLayout from "@/components/hoc/withAdminLayout";
import {
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    DocumentArrowDownIcon,
    EnvelopeIcon,
    EyeIcon,
    ArrowPathIcon,
    ChevronDownIcon,
    BriefcaseIcon,
    ChevronLeftIcon,
    ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { getIPFSGatewayUrl } from "@/utils/ipfsUpload";
import { useParams, useRouter } from "next/navigation";

function AdminJobApplicationsPage() {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState<JobStruct | null>(null);
    const [applications, setApplications] = useState<ApplicationStruct[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [showFilters, setShowFilters] = useState(true);

    useEffect(() => {
        fetchJob();
    }, [params.id]);

    const fetchJob = async () => {
        try {
            setLoading(true);
            const jobData = await getJob(Number(params.id));
            setJob(jobData);
            fetchApplications(Number(params.id));
        } catch (error) {
            console.error("Error fetching job:", error);
            toast.error("Failed to fetch job details");
            setLoading(false);
        }
    };

    const fetchApplications = async (jobId: number) => {
        try {
            const jobApplications = await getJobApplications(jobId);
            setApplications(jobApplications);
        } catch (error) {
            console.error(`Error fetching applications for job ${jobId}:`, error);
            toast.error("Failed to fetch applications");
        } finally {
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
            fetchApplications(jobId); // Refresh applications
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
        router.push(`/dashboard/admin/applications/${jobId}-${applicantAddress}`);
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

    const refreshData = async () => {
        setRefreshing(true);
        await fetchJob();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    // Calculate statistics
    const totalApplications = filteredApplications.length;
    const pendingCount = filteredApplications.filter(app => Number(app.currentState) === ApplicationState.PENDING).length;
    const shortlistedCount = filteredApplications.filter(app => Number(app.currentState) === ApplicationState.SHORTLISTED).length;
    const rejectedCount = filteredApplications.filter(app => Number(app.currentState) === ApplicationState.REJECTED).length;
    const hiredCount = filteredApplications.filter(app => Number(app.currentState) === ApplicationState.HIRED).length;

    // Calculate percentages
    const pendingPercentage = totalApplications > 0 ? Math.round((pendingCount / totalApplications) * 100) : 0;
    const shortlistedPercentage = totalApplications > 0 ? Math.round((shortlistedCount / totalApplications) * 100) : 0;
    const rejectedPercentage = totalApplications > 0 ? Math.round((rejectedCount / totalApplications) * 100) : 0;
    const hiredPercentage = totalApplications > 0 ? Math.round((hiredCount / totalApplications) * 100) : 0;

    return (
        <div className="w-full">
            <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                    <button
                        onClick={() => router.push('/dashboard/admin/jobs')}
                        className="inline-flex items-center text-gray-400 hover:text-white"
                    >
                        <ChevronLeftIcon className="h-5 w-5 mr-1" />
                        Back to Jobs
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/admin/applications')}
                        className="inline-flex items-center text-gray-400 hover:text-white"
                    >
                        <ChevronLeftIcon className="h-5 w-5 mr-1" />
                        All Applications
                    </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-white">{job?.title || "Job Applications"}</h1>
                            {job?.logoCID && (
                                <div className="ml-3 h-8 w-8">
                                    <img
                                        src={getIPFSGatewayUrl(job.logoCID)}
                                        alt={job.title || 'Job'}
                                        className="h-8 w-8 rounded-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40';
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                        <p className="text-gray-400 mt-1">
                            Applications for {job?.title || "this job"} from {job?.orgName || "employer"}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex space-x-3">
                        <button
                            onClick={() => router.push('/dashboard/admin/applications')}
                            className="flex items-center px-4 py-2 bg-blue-800/40 hover:bg-blue-700/50 rounded-md text-white transition-colors"
                        >
                            <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                            View All Applications
                        </button>
                    </div>
                </div>
            </div>

            {/* Job Details Card */}
            <div className="bg-gray-800/30 rounded-lg shadow-md p-6 border border-gray-700/50 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex items-center mb-4 md:mb-0">
                        <BriefcaseIcon className="h-12 w-12 text-gray-400 mr-4" />
                        <div>
                            <h2 className="text-xl font-semibold text-white">{job?.title}</h2>
                            <p className="text-gray-400">{job?.orgName}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Posted {job?.startTime ? formatDistanceToNow(new Date(Number(job.startTime) * 1000), { addSuffix: true }) : 'recently'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <div className="text-right">
                            <span className="text-gray-400 text-sm">Salary Range:</span>
                            <span className="ml-2 text-white">${job?.minimumSalary} - ${job?.maximumSalary}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-gray-400 text-sm">Status:</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${job?.isOpen && !job?.expired
                                ? 'bg-green-500/20 text-green-400'
                                : job?.expired
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                {job?.isOpen && !job?.expired ? 'Active' : job?.expired ? 'Expired' : 'Closed'}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-gray-400 text-sm">Employer:</span>
                            <span className="ml-2 text-white">{job?.orgName}</span>
                        </div>
                    </div>
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
                            <span className="text-blue-400 text-xl font-bold">{pendingPercentage}%</span>
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
                            <span className="text-yellow-400 text-xl font-bold">{shortlistedPercentage}%</span>
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
                            <span className="text-red-400 text-xl font-bold">{rejectedPercentage}%</span>
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
                            <span className="text-green-400 text-xl font-bold">{hiredPercentage}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800/30 rounded-lg shadow-md p-6 border border-gray-700/50 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Applications</h2>
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

                {filteredApplications.length === 0 ? (
                    <div className="bg-gray-900/30 rounded-lg p-8 text-center">
                        <p className="text-gray-400 mb-2">No applications found</p>
                        <p className="text-sm text-gray-500">Try adjusting your filters or wait for candidates to apply</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Applicant
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
                                {filteredApplications.map((application) => (
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
                                            <div className="text-sm text-white">{application.email || 'No email'}</div>
                                            <div className="text-sm text-gray-400">{application.phoneNumber || 'No phone'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {application.applicationTimestamp ? formatDistanceToNow(
                                                new Date(Number(BigInt(application.applicationTimestamp) * BigInt(1000))),
                                                { addSuffix: true }
                                            ) : 'Unknown date'}
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
                                                    value={application.currentState !== undefined ? application.currentState.toString() : "0"}
                                                    onChange={(e) => {
                                                        try {
                                                            handleUpdateStatus(
                                                                application.jobId,
                                                                application.applicant,
                                                                parseInt(e.target.value)
                                                            );
                                                        } catch (error) {
                                                            console.error("Error updating status:", error);
                                                            toast.error("Failed to update status");
                                                        }
                                                    }}
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAdminLayout(AdminJobApplicationsPage); 