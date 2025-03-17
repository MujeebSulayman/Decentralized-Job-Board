"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJob, getJobApplicantDetails, updateApplicationStatus } from "@/services/blockchain";
import { ApplicationState, ApplicationStruct, JobStruct } from "@/utils/type.dt";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";
import withAdminLayout from "@/components/hoc/withAdminLayout";
import {
    ArrowLeftIcon,
    DocumentArrowDownIcon,
    EnvelopeIcon,
    BriefcaseIcon,
    MapPinIcon,
    PhoneIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    BuildingOfficeIcon,
    CurrencyDollarIcon,
    ComputerDesktopIcon,
    UserIcon,
    CalendarIcon,
    ChevronRightIcon,
    DocumentTextIcon,
    ExclamationCircleIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { getIPFSGatewayUrl } from "@/utils/ipfsUpload";
import Link from "next/link";

function AdminApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [application, setApplication] = useState<ApplicationStruct | null>(null);
    const [job, setJob] = useState<JobStruct | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'responses'>('details');

    useEffect(() => {
        fetchApplicationDetails();
    }, [params.id]);

    const fetchApplicationDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const idParam = params.id as string;
            const [jobId, applicantAddress] = idParam.split("-");

            if (!jobId || !applicantAddress) {
                setError("Invalid application ID format");
                return;
            }

            const [jobData, applicationData] = await Promise.all([
                getJob(Number(jobId)),
                getJobApplicantDetails(Number(jobId), applicantAddress)
            ]);

            console.log("Application Data:", applicationData);

            setJob(jobData);
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
            setUpdating(true);
            await updateApplicationStatus(application.jobId, application.applicant, newStatus);
            setApplication({ ...application, currentState: newStatus });
            toast.success("Application status updated successfully");
        } catch (error) {
            console.error("Error updating application status:", error);
            toast.error("Failed to update application status");
        } finally {
            setUpdating(false);
        }
    };

    const handleContactApplicant = () => {
        if (application?.email) {
            window.open(`mailto:${application.email}`, '_blank');
        } else {
            toast.error("Email not available");
        }
    };

    const handleViewCV = () => {
        if (application?.cvCID) {
            window.open(getIPFSGatewayUrl(application.cvCID), '_blank');
        } else {
            toast.error("CV not available");
        }
    };

    const getStatusInfo = (status: ApplicationState) => {
        const statusConfigs = {
            [ApplicationState.PENDING]: {
                color: "blue",
                bgColor: "bg-blue-500/10",
                borderColor: "border-blue-500/30",
                textColor: "text-blue-400",
                icon: <ClockIcon className="h-5 w-5" />,
                text: "Pending",
                description: "Application is pending review"
            },
            [ApplicationState.SHORTLISTED]: {
                color: "yellow",
                bgColor: "bg-yellow-500/10",
                borderColor: "border-yellow-500/30",
                textColor: "text-yellow-400",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                text: "Shortlisted",
                description: "Candidate has been shortlisted"
            },
            [ApplicationState.REJECTED]: {
                color: "red",
                bgColor: "bg-red-500/10",
                borderColor: "border-red-500/30",
                textColor: "text-red-400",
                icon: <XCircleIcon className="h-5 w-5" />,
                text: "Rejected",
                description: "Application has been rejected"
            },
            [ApplicationState.HIRED]: {
                color: "green",
                bgColor: "bg-green-500/10",
                borderColor: "border-green-500/30",
                textColor: "text-green-400",
                icon: <CheckCircleIcon className="h-5 w-5" />,
                text: "Hired",
                description: "Candidate has been hired"
            }
        };

        return statusConfigs[status] || statusConfigs[ApplicationState.PENDING];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
                    <p className="text-gray-400">Loading application details...</p>
                </div>
            </div>
        );
    }

    if (error || !application || !job) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
                <ExclamationCircleIcon className="h-16 w-16 text-red-500 mb-4" />
                <div className="text-red-400 text-xl font-semibold mb-2">Application Not Found</div>
                <p className="text-gray-400 mb-6">{error || "The requested application could not be found"}</p>
                <Link
                    href="/dashboard/admin/applications"
                    className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Return to applications list
                </Link>
            </div>
        );
    }

    const statusInfo = getStatusInfo(application.currentState);
    const applicationDate = new Date(Number(BigInt(application.applicationTimestamp) * BigInt(1000)));

    return (
        <div className="w-full bg-gray-900 min-h-screen">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 px-4 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/dashboard/admin/applications"
                            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                            <ArrowLeftIcon className="h-5 w-5 text-gray-400" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">Application Details</h1>
                            <p className="text-gray-400 text-sm">Reviewing application from {application.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={fetchApplicationDetails}
                            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                            title="Refresh data"
                        >
                            <ArrowPathIcon className="h-5 w-5 text-gray-400" />
                        </button>
                        <button
                            onClick={handleViewCV}
                            className="flex items-center px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                            <DocumentArrowDownIcon className="h-5 w-5 mr-1.5" />
                            <span className="text-sm font-medium">View CV</span>
                        </button>
                        <button
                            onClick={handleContactApplicant}
                            className="flex items-center px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                            <EnvelopeIcon className="h-5 w-5 mr-1.5" />
                            <span className="text-sm font-medium">Contact</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Application Status Banner */}
                <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-xl p-4 mb-8 flex items-center justify-between`}>
                    <div className="flex items-center">
                        <div className={`${statusInfo.textColor} mr-3`}>
                            {statusInfo.icon}
                        </div>
                        <div>
                            <h3 className={`font-medium ${statusInfo.textColor}`}>Status: {statusInfo.text}</h3>
                            <p className="text-gray-400 text-sm">{statusInfo.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <select
                            value={application.currentState}
                            onChange={(e) => handleUpdateStatus(parseInt(e.target.value))}
                            disabled={updating}
                            className="bg-gray-900/70 border border-gray-700 rounded-lg py-1.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                        >
                            <option value={ApplicationState.PENDING}>Set as Pending</option>
                            <option value={ApplicationState.SHORTLISTED}>Set as Shortlisted</option>
                            <option value={ApplicationState.REJECTED}>Set as Rejected</option>
                            <option value={ApplicationState.HIRED}>Set as Hired</option>
                        </select>
                        {updating && <div className="ml-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-500"></div>}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Applicant Info */}
                    <div className="lg:col-span-2">
                        {/* Applicant Profile Card */}
                        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-8">
                            <div className="flex items-start">
                                <div className="h-20 w-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30 mr-6">
                                    <span className="text-indigo-400 font-semibold text-2xl">
                                        {application.name.substring(0, 2).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-white mb-1">{application.name}</h2>
                                    <div className="flex items-center text-gray-400 mb-4">
                                        <MapPinIcon className="h-4 w-4 mr-1" />
                                        <span className="text-sm">{application.location || "Location not specified"}</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        <div className="flex items-start">
                                            <div className="bg-gray-700/30 rounded-lg p-2 mr-3">
                                                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Email</p>
                                                <p className="text-gray-300">{application.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="bg-gray-700/30 rounded-lg p-2 mr-3">
                                                <PhoneIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Phone</p>
                                                <p className="text-gray-300">{application.phoneNumber || "Not provided"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="bg-gray-700/30 rounded-lg p-2 mr-3">
                                                <CalendarIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Applied</p>
                                                <p className="text-gray-300">
                                                    {applicationDate.toLocaleDateString()} ({formatDistanceToNow(applicationDate, { addSuffix: true })})
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start">
                                            <div className="bg-gray-700/30 rounded-lg p-2 mr-3">
                                                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">CV/Resume</p>
                                                <button
                                                    onClick={handleViewCV}
                                                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                                                >
                                                    {application.cvCID ? "View Document" : "Not available"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-700/50">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">Blockchain Address</h3>
                                <div className="bg-gray-900/50 rounded-lg p-3 overflow-x-auto">
                                    <p className="text-gray-300 font-mono text-sm">{application.applicant}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex border-b border-gray-700 mb-6">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'details'
                                    ? 'text-white border-b-2 border-green-500'
                                    : 'text-gray-400 hover:text-gray-300'}`}
                            >
                                Job Details
                            </button>
                            <button
                                onClick={() => setActiveTab('responses')}
                                className={`px-4 py-2 font-medium text-sm ${activeTab === 'responses'
                                    ? 'text-white border-b-2 border-green-500'
                                    : 'text-gray-400 hover:text-gray-300'}`}
                            >
                                Application Responses
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'details' && (
                            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                                <div className="flex items-center mb-6">
                                    {job.logoCID ? (
                                        <img
                                            src={getIPFSGatewayUrl(job.logoCID)}
                                            alt={job.title}
                                            className="h-14 w-14 rounded-xl object-cover mr-4"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/56';
                                            }}
                                        />
                                    ) : (
                                        <div className="h-14 w-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mr-4">
                                            <BriefcaseIcon className="h-7 w-7 text-purple-400" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{job.title}</h3>
                                        <p className="text-gray-400">{job.orgName}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gray-900/30 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <BriefcaseIcon className="h-5 w-5 text-gray-500 mr-2" />
                                            <h4 className="text-sm font-medium text-gray-400">Job Type</h4>
                                        </div>
                                        <p className="text-white">
                                            {job.jobType !== undefined && job.jobType >= 0 && job.jobType <= 4 ?
                                                ["Full Time", "Part Time", "Internship", "Freelance", "Contract"][job.jobType] :
                                                "Unknown"}
                                        </p>
                                    </div>

                                    <div className="bg-gray-900/30 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <ComputerDesktopIcon className="h-5 w-5 text-gray-500 mr-2" />
                                            <h4 className="text-sm font-medium text-gray-400">Work Mode</h4>
                                        </div>
                                        <p className="text-white">
                                            {job.workMode !== undefined && job.workMode >= 0 && job.workMode <= 2 ?
                                                ["Remote", "Onsite", "Hybrid"][job.workMode] :
                                                "Unknown"}
                                        </p>
                                    </div>

                                    <div className="bg-gray-900/30 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <CurrencyDollarIcon className="h-5 w-5 text-gray-500 mr-2" />
                                            <h4 className="text-sm font-medium text-gray-400">Salary Range</h4>
                                        </div>
                                        <p className="text-white">{job.minimumSalary} - {job.maximumSalary}</p>
                                    </div>
                                </div>

                                <Link
                                    href={`/dashboard/admin/jobs/${job.id}`}
                                    className="inline-flex items-center mt-6 text-green-400 text-sm hover:text-green-300 transition-colors"
                                >
                                    View complete job details
                                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                                </Link>
                            </div>
                        )}

                        {activeTab === 'responses' && (
                            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                                <h3 className="text-lg font-semibold text-white mb-4">Application Details</h3>

                                {/* Basic Information */}
                                <div className="space-y-6 mb-8">
                                    <div className="bg-gray-900/30 rounded-lg p-5">
                                        <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
                                            <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                                            Basic Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Full Name</p>
                                                <p className="text-white">{application.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Location</p>
                                                <p className="text-white">{application.location || "Not specified"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Email</p>
                                                <p className="text-white">{application.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                                                <p className="text-white">{application.phoneNumber || "Not provided"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Information */}
                                    <div className="bg-gray-900/30 rounded-lg p-5">
                                        <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
                                            <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
                                            Professional Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Experience</p>
                                                <p className="text-white whitespace-pre-wrap">
                                                    {application?.experience ? application.experience : "Not provided"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Expected Salary</p>
                                                <p className="text-white">
                                                    {application?.expectedSalary ? application.expectedSalary : "Not specified"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Portfolio Link</p>
                                                <p className="text-white">
                                                    {application?.portfolioLink ? (
                                                        <a
                                                            href={application.portfolioLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:text-blue-300"
                                                        >
                                                            View Portfolio
                                                        </a>
                                                    ) : "Not provided"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">GitHub Profile</p>
                                                <p className="text-white">
                                                    {application?.github ? (
                                                        <a
                                                            href={application.github}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:text-blue-300"
                                                        >
                                                            View GitHub
                                                        </a>
                                                    ) : "Not provided"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CV/Resume */}
                                    <div className="bg-gray-900/30 rounded-lg p-5">
                                        <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
                                            <DocumentArrowDownIcon className="h-5 w-5 text-gray-400 mr-2" />
                                            CV/Resume
                                        </h4>
                                        <div className="flex items-center justify-between">
                                            <p className="text-white">
                                                {application.cvCID ? "CV has been uploaded" : "No CV uploaded"}
                                            </p>
                                            {application.cvCID && (
                                                <button
                                                    onClick={handleViewCV}
                                                    className="flex items-center px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                                >
                                                    <DocumentArrowDownIcon className="h-5 w-5 mr-1.5" />
                                                    View CV
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Custom Field Responses */}
                                    {job.customField.length > 0 && (
                                        <div className="bg-gray-900/30 rounded-lg p-5">
                                            <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
                                                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                                                Additional Questions
                                            </h4>
                                            <div className="space-y-4">
                                                {job.customField.map((field, index) => (
                                                    <div key={index} className="border-b border-gray-700/50 last:border-0 pb-4 last:pb-0">
                                                        <div className="flex items-center mb-2">
                                                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${field.isRequired ? 'bg-red-500' : 'bg-gray-500'
                                                                }`}></span>
                                                            <p className="text-sm font-medium text-gray-300">
                                                                {field.fieldName}
                                                                {field.isRequired && (
                                                                    <span className="text-red-400 text-xs ml-1">(Required)</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <p className="text-white whitespace-pre-wrap pl-4">
                                                            {application.fieldResponse[index] || "No response provided"}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Application Status */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 sticky top-24">
                            <h3 className="text-lg font-semibold text-white mb-4">Application Status</h3>

                            <div className="space-y-4">
                                {/* Status Display */}
                                <div className="bg-gray-900/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-gray-400">Current Status</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${application.currentState === ApplicationState.PENDING ? 'bg-blue-500/20 text-blue-400' :
                                            application.currentState === ApplicationState.SHORTLISTED ? 'bg-yellow-500/20 text-yellow-400' :
                                                application.currentState === ApplicationState.REJECTED ? 'bg-red-500/20 text-red-400' :
                                                    'bg-green-500/20 text-green-400'
                                            }`}>
                                            {ApplicationState[application.currentState]}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-gray-400">Applied On</span>
                                        <span className="text-sm text-white">
                                            {new Date(Number(BigInt(application.applicationTimestamp) * BigInt(1000))).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Time Since Applied</span>
                                        <span className="text-sm text-white">
                                            {formatDistanceToNow(
                                                new Date(Number(BigInt(application.applicationTimestamp) * BigInt(1000))),
                                                { addSuffix: true }
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Status Update */}
                                <div className="bg-gray-900/50 rounded-lg p-4">
                                    <label className="block text-sm text-gray-400 mb-2">
                                        Update Status
                                    </label>
                                    <select
                                        value={application.currentState}
                                        onChange={(e) => handleUpdateStatus(parseInt(e.target.value))}
                                        disabled={updating}
                                        className="w-full bg-gray-900/70 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                                    >
                                        <option value={ApplicationState.PENDING}>Set as Pending</option>
                                        <option value={ApplicationState.SHORTLISTED}>Set as Shortlisted</option>
                                        <option value={ApplicationState.REJECTED}>Set as Rejected</option>
                                        <option value={ApplicationState.HIRED}>Set as Hired</option>
                                    </select>
                                    {updating && (
                                        <div className="flex items-center justify-center mt-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-500"></div>
                                            <span className="ml-2 text-sm text-gray-400">Updating...</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="space-y-2">
                                    <button
                                        onClick={handleContactApplicant}
                                        className="w-full flex items-center justify-between px-4 py-2 bg-gray-900/70 hover:bg-gray-900 rounded-lg text-gray-300 transition-colors"
                                    >
                                        <span className="flex items-center">
                                            <EnvelopeIcon className="h-5 w-5 mr-2 text-green-500" />
                                            Send Email
                                        </span>
                                        <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                                    </button>

                                    <button
                                        onClick={handleViewCV}
                                        className="w-full flex items-center justify-between px-4 py-2 bg-gray-900/70 hover:bg-gray-900 rounded-lg text-gray-300 transition-colors"
                                    >
                                        <span className="flex items-center">
                                            <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-blue-500" />
                                            View CV/Resume
                                        </span>
                                        <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                                    </button>

                                    <Link
                                        href={`/dashboard/admin/jobs/${job.id}`}
                                        className="w-full flex items-center justify-between px-4 py-2 bg-gray-900/70 hover:bg-gray-900 rounded-lg text-gray-300 transition-colors"
                                    >
                                        <span className="flex items-center">
                                            <BriefcaseIcon className="h-5 w-5 mr-2 text-purple-500" />
                                            View Job Details
                                        </span>
                                        <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAdminLayout(AdminApplicationDetailPage); 