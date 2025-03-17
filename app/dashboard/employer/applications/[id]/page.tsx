"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJob, getJobApplicantDetails, updateApplicationStatus } from "@/services/blockchain";
import { ApplicationState, ApplicationStruct, JobStruct } from "@/utils/type.dt";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";
import withEmployerlayout from "@/components/hoc/withEmployerlayout";
import { ArrowLeftIcon, DocumentArrowDownIcon, EnvelopeIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { getIPFSGatewayUrl } from "@/utils/ipfsUpload";
import Link from "next/link";

function EmployerApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [application, setApplication] = useState<ApplicationStruct | null>(null);
    const [job, setJob] = useState<JobStruct | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    useEffect(() => {
        fetchApplicationDetails();
    }, [params.id]);

    const fetchApplicationDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            // Parse the ID parameter (format: jobId-applicantAddress)
            const idParam = params.id as string;
            const [jobId, applicantAddress] = idParam.split("-");

            if (!jobId || !applicantAddress) {
                setError("Invalid application ID format");
                setLoading(false);
                return;
            }

            // Fetch job details
            const jobData = await getJob(Number(jobId));
            setJob(jobData);

            // Fetch application details
            const applicationData = await getJobApplicantDetails(Number(jobId), applicantAddress);

            if (!applicationData) {
                setError("Application not found");
                setLoading(false);
                return;
            }

            setApplication(applicationData);
        } catch (error) {
            console.error("Error fetching application details:", error);
            setError("Failed to fetch application details");
            toast.error("Failed to fetch application details");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: ApplicationState) => {
        if (!application) return;

        try {
            await updateApplicationStatus(application.jobId, application.applicant, newStatus);
            toast.success("Application status updated successfully");

            // Update the local state
            setApplication({
                ...application,
                currentState: newStatus
            });
        } catch (error) {
            console.error("Error updating application status:", error);
            toast.error("Failed to update application status");
        }
    };

    const handleContactApplicant = () => {
        if (application?.email) {
            window.open(`mailto:${application.email}`, '_blank');
        }
    };

    const handleViewCV = () => {
        if (application?.cvCID) {
            window.open(getIPFSGatewayUrl(application.cvCID), '_blank');
        }
    };

    const getStatusInfo = (status: ApplicationState) => {
        switch (status) {
            case ApplicationState.PENDING:
                return {
                    color: 'text-blue-400',
                    bgColor: 'bg-blue-500/20',
                    borderColor: 'border-blue-500/30',
                    textColor: 'text-blue-400',
                    icon: ClockIcon,
                    text: 'Pending',
                    description: 'Application is under review'
                };
            case ApplicationState.SHORTLISTED:
                return {
                    color: 'text-yellow-400',
                    bgColor: 'bg-yellow-500/20',
                    borderColor: 'border-yellow-500/30',
                    textColor: 'text-yellow-400',
                    icon: CheckCircleIcon,
                    text: 'Shortlisted',
                    description: 'Candidate has been shortlisted'
                };
            case ApplicationState.REJECTED:
                return {
                    color: 'text-red-400',
                    bgColor: 'bg-red-500/20',
                    borderColor: 'border-red-500/30',
                    textColor: 'text-red-400',
                    icon: XCircleIcon,
                    text: 'Rejected',
                    description: 'Application has been rejected'
                };
            case ApplicationState.HIRED:
                return {
                    color: 'text-green-400',
                    bgColor: 'bg-green-500/20',
                    borderColor: 'border-green-500/30',
                    textColor: 'text-green-400',
                    icon: CheckCircleIcon,
                    text: 'Hired',
                    description: 'Candidate has been hired'
                };
            default:
                return {
                    color: 'text-gray-400',
                    bgColor: 'bg-gray-500/20',
                    borderColor: 'border-gray-500/30',
                    textColor: 'text-gray-400',
                    icon: ClockIcon,
                    text: 'Pending',
                    description: 'Application is under review'
                };
        }
    };

    // Helper function to safely get application state string
    const safeGetApplicationState = (state: number): string => {
        if (state === undefined || state < 0 || state > 3) {
            return `Status ${state}`;
        }
        return ApplicationState[state];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
                <div className="text-red-500 mb-4">{error}</div>
                <Link href="/dashboard/employer/applications" className="text-green-500 hover:underline">
                    Return to applications list
                </Link>
            </div>
        );
    }

    // Wrap the entire render in a try-catch to handle any potential errors
    try {
        if (!application || !job) {
            return (
                <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
                    <div className="text-red-500 mb-4">Application or job not found</div>
                    <Link href="/dashboard/employer/applications" className="text-green-500 hover:underline">
                        Return to applications list
                    </Link>
                </div>
            );
        }

        return (
            <div className="w-full">
                <div className="mb-8 flex items-center">
                    <Link
                        href="/dashboard/employer/applications"
                        className="mr-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Application Details</h1>
                        <p className="text-gray-400 mt-1">
                            View and manage application from {application.name}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Application Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800/30 rounded-lg shadow-md p-6 border border-gray-700/50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-gray-700/50">
                                <div className="flex items-center mb-4 md:mb-0">
                                    <div className="flex-shrink-0 h-16 w-16 bg-green-900/30 rounded-full flex items-center justify-center border border-green-500/30 mr-4">
                                        <span className="text-green-400 font-medium text-xl">
                                            {application.name.substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">{application.name}</h2>
                                        <p className="text-gray-400">{application.location}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Applied {formatDistanceToNow(
                                                new Date(Number(application.applicationTimestamp) * 1000),
                                                { addSuffix: true }
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusInfo(application.currentState).bgColor}`}>
                                        {getStatusInfo(application.currentState).text}
                                    </span>
                                    <select
                                        value={application.currentState}
                                        onChange={(e) => handleUpdateStatus(parseInt(e.target.value))}
                                        className="bg-gray-900/70 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                                        disabled={updatingStatus === `${application.jobId}-${application.applicant}`}
                                    >
                                        <option value="0">Set as Pending</option>
                                        <option value="1">Set as Shortlisted</option>
                                        <option value="2">Set as Rejected</option>
                                        <option value="3">Set as Hired</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 mb-2">Contact Information</h3>
                                    <div className="bg-gray-900/30 rounded-lg p-4">
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="text-white">{application.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="text-white">{application.phoneNumber}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400 mb-2">Applicant Address</h3>
                                    <div className="bg-gray-900/30 rounded-lg p-4">
                                        <p className="text-white break-all">{application.applicant}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-sm font-medium text-gray-400 mb-2">Application Responses</h3>
                                <div className="bg-gray-900/30 rounded-lg p-4">
                                    {job.customField.map((field, index) => (
                                        <div key={index} className="mb-4 last:mb-0">
                                            <p className="text-xs text-gray-500">{field.fieldName}</p>
                                            <p className="text-white">{application.fieldResponse[index] || "No response"}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={handleViewCV}
                                    className="flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors"
                                >
                                    <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                    View CV
                                </button>
                                <button
                                    onClick={handleContactApplicant}
                                    className="flex items-center px-4 py-2 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-colors"
                                >
                                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                                    Contact Applicant
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Job Details */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800/30 rounded-lg shadow-md p-6 border border-gray-700/50">
                            <h3 className="text-lg font-semibold text-white mb-4">Job Details</h3>

                            <div className="flex items-center mb-4">
                                {job.logoCID && (
                                    <div className="flex-shrink-0 h-12 w-12 mr-3">
                                        <img
                                            src={getIPFSGatewayUrl(job.logoCID)}
                                            alt={job.title}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-white font-medium">{job.title}</h4>
                                    <p className="text-gray-400 text-sm">{job.orgName}</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-500">Job Type</p>
                                    <p className="text-white">{job.jobType !== undefined && job.jobType >= 0 && job.jobType <= 4 ?
                                        ["Full Time", "Part Time", "Internship", "Freelance", "Contract"][job.jobType] :
                                        "Unknown"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Work Mode</p>
                                    <p className="text-white">{job.workMode !== undefined && job.workMode >= 0 && job.workMode <= 2 ?
                                        ["Remote", "Onsite", "Hybrid"][job.workMode] :
                                        "Unknown"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Salary Range</p>
                                    <p className="text-white">{job.minimumSalary} - {job.maximumSalary}</p>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-700/50">
                                <h4 className="text-white font-medium mb-2">Description</h4>
                                <p className="text-gray-400 text-sm line-clamp-6">{job.description}</p>
                                <Link
                                    href={`/dashboard/employer/jobs/${job.id}`}
                                    className="text-green-500 text-sm hover:underline mt-2 inline-block"
                                >
                                    View full job details
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error rendering application details:", error);
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
                <div className="text-red-500 mb-4">There was an error displaying this application</div>
                <Link href="/dashboard/employer/applications" className="text-green-500 hover:underline">
                    Return to applications list
                </Link>
            </div>
        );
    }
}

export default withEmployerlayout(EmployerApplicationDetailPage);
