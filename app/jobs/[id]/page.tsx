"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getIPFSGatewayUrl } from '@/utils/ipfsUpload';
import { getJob, getMyJobs } from '@/services/blockchain';
import { JobStruct, WorkMode, JobType } from '@/utils/type.dt';
import {
    MapPinIcon,
    CurrencyDollarIcon,
    BriefcaseIcon,
    ClockIcon,
    BuildingOfficeIcon,
    ShareIcon,
    BookmarkIcon,
    CalendarIcon,
    UserGroupIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

const JobDetailsPage = () => {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState<JobStruct | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [companyJobs, setCompanyJobs] = useState<JobStruct[]>([]);

    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                if (!params.id) return;
                const jobData = await getJob(Number(params.id));
                setJob(jobData);

                const employerJobs = await getMyJobs();
                setCompanyJobs(employerJobs.filter(j => j.employer === jobData.employer && j.id !== jobData.id));
            } catch (error) {
                console.error('Error fetching job details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobDetails();
    }, [params.id]);

    if (isLoading) {
        return <LoadingState />;
    }

    if (!job) {
        return <NotFoundState />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            {/* Back Button and Actions */}
            <div className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeftIcon className="h-5 w-5 mr-2" />
                        Back to Jobs
                    </button>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('Link copied to clipboard!');
                        }}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Share job"
                    >
                        <ShareIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Company and Job Header */}
                        <div className="flex items-center space-x-4">
                            <div className="relative w-16 h-16">
                                {job.logoCID ? (
                                    <Image
                                        src={getIPFSGatewayUrl(job.logoCID)}
                                        alt={job.orgName}
                                        fill
                                        className="rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                        <BuildingOfficeIcon className="h-8 w-8 text-purple-400" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{job.title}</h1>
                                <div className="flex items-center space-x-2">
                                    <p className="text-purple-400">{job.orgName}</p>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-gray-400 text-sm">
                                        {companyJobs.length + 1} {companyJobs.length + 1 === 1 ? 'job' : 'jobs'} posted
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Job Quick Info */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <QuickInfoCard
                                icon={<BriefcaseIcon className="h-5 w-5" />}
                                title="Job Type"
                                value={JobType[job.jobType]}
                            />
                            <QuickInfoCard
                                icon={<MapPinIcon className="h-5 w-5" />}
                                title="Work Mode"
                                value={WorkMode[job.workMode]}
                            />
                            <QuickInfoCard
                                icon={<CurrencyDollarIcon className="h-5 w-5" />}
                                title="Salary Range"
                                value={`$${job.minimumSalary} - $${job.maximumSalary}`}
                            />
                        </div>

                        {/* Job Description */}
                        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                            <h2 className="text-xl font-semibold mb-6">Job Description</h2>
                            <div
                                className="prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: job.description }}
                            />
                            <style jsx global>{`
                                .prose {
                                    color: #D1D5DB;
                                    max-width: none;
                                }
                                .prose h1, .prose h2, .prose h3, .prose h4 {
                                    color: #fff;
                                    margin-top: 1.5em;
                                    margin-bottom: 0.5em;
                                }
                                .prose p {
                                    margin-bottom: 1.25em;
                                    line-height: 1.75;
                                }
                                .prose ul, .prose ol {
                                    margin-top: 1.25em;
                                    margin-bottom: 1.25em;
                                    padding-left: 1.625em;
                                }
                                .prose ul { list-style-type: disc; }
                                .prose ol { list-style-type: decimal; }
                                .prose li {
                                    margin-top: 0.5em;
                                    margin-bottom: 0.5em;
                                }
                                .prose strong { color: #fff; }
                                .prose a { color: #A78BFA; }
                            `}</style>
                        </div>

                        {/* Requirements */}
                        {job.customField && job.customField.length > 0 && job.customField.some(field => field.fieldName.trim()) && (
                            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                                <h2 className="text-xl font-semibold mb-6">Additional Requirements</h2>
                                <div className="space-y-4">
                                    {job.customField
                                        .filter(field => field.fieldName.trim()) // Only show fields with non-empty names
                                        .map((field, index) => (
                                            <RequirementItem
                                                key={index}
                                                requirement={field.fieldName}
                                                isRequired={field.isRequired}
                                            />
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Other Jobs from Company */}
                        {companyJobs.length > 0 && (
                            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold">More Jobs at {job.orgName}</h2>
                                    <span className="text-gray-400 text-sm">
                                        {companyJobs.length} other {companyJobs.length === 1 ? 'job' : 'jobs'}
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {companyJobs.map((otherJob) => (
                                        <div
                                            key={otherJob.id}
                                            onClick={() => router.push(`/jobs/${otherJob.id}`)}
                                            className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl cursor-pointer hover:bg-gray-800/50 transition-colors"
                                        >
                                            <div>
                                                <h3 className="font-medium text-white mb-1">{otherJob.title}</h3>
                                                <div className="text-sm text-gray-400">
                                                    Posted {formatDistanceToNow(new Date(Number(otherJob.startTime) * 1000), { addSuffix: true })}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-gray-400">${otherJob.minimumSalary} - ${otherJob.maximumSalary}</span>
                                                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Application Card */}
                            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center justify-between text-gray-400">
                                        <span>Posted</span>
                                        <span>{new Date(Number(job.startTime) * 1000).toLocaleDateString()}</span>
                                    </div>
                              
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Status</span>
                                        <span className={`px-3 py-1 rounded-full text-sm ${job.isOpen && !job.expired
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {job.isOpen && !job.expired ? 'Active' : 'Closed'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-gray-400">
                                        <span>Time Left</span>
                                        <span>{formatDistanceToNow(new Date(Number(job.expirationTime) * 1000), { addSuffix: true })}</span>
                                    </div>
                                </div>

                                {job.isOpen && !job.expired && (
                                    <button
                                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-medium"
                                        onClick={() => router.push(`/jobs/${job.id}/apply`)}
                                    >
                                        Apply Now
                                    </button>
                                )}
                            </div>

                            {/* Company Info */}
                            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                                <h3 className="text-lg font-semibold mb-4">About Company</h3>
                                <div className="space-y-4 text-gray-400">
                                    <div className="flex items-center justify-between">
                                        <span>Company</span>
                                        <span className="text-white">{job.orgName}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Contact</span>
                                        <span className="text-white">{job.orgEmail}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Employer</span>
                                        <span className="text-white font-mono text-sm">
                                            {`${job.employer.slice(0, 6)}...${job.employer.slice(-4)}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Company Jobs Link */}
                            <div
                                onClick={() => router.push(`/employers/${job.employer}`)}
                                className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors cursor-pointer"
                            >
                                <BuildingOfficeIcon className="h-5 w-5" />
                                <span>View all jobs from {job.orgName}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuickInfoCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) => (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center text-gray-400 mb-2">
            {icon}
            <span className="ml-2 text-sm">{title}</span>
        </div>
        <div className="text-white font-medium">{value}</div>
    </div>
);

const RequirementItem = ({ requirement, isRequired }: { requirement: string, isRequired: boolean }) => (
    <div className="flex items-start space-x-3 bg-gray-900/50 p-4 rounded-xl">
        <div className="h-2 w-2 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
        <div className="flex-1">
            <p className="text-gray-300">{requirement}</p>
            {isRequired && (
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400 mt-2">
                    Required
                </span>
            )}
        </div>
    </div>
);

const LoadingState = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
);

const NotFoundState = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-400">Job not found</h2>
            <p className="text-gray-500 mt-2">This job posting may have been removed or expired.</p>
        </div>
    </div>
);

export default JobDetailsPage; 