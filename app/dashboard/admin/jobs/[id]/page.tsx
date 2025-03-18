"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { getJob, getJobApplications, closeJob, deleteJob } from '@/services/blockchain';
import { JobStruct, ApplicationStruct, JobType, WorkMode } from '@/utils/type.dt';
import Image from 'next/image';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { formatDistanceToNow } from 'date-fns';
import { getIPFSGatewayUrl } from '@/utils/ipfsUpload';

interface ModalProps {
    isOpen: boolean;
    action: 'close' | 'delete' | null;
    onConfirm: () => void;
    onCancel: () => void;
}

const JobDetails = () => {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState<JobStruct | null>(null);
    const [applications, setApplications] = useState<ApplicationStruct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState<ModalProps>({
        isOpen: false,
        action: null,
        onConfirm: () => { },
        onCancel: () => { }
    });

    useEffect(() => {
        fetchJobDetails();
    }, [params.id]);

    const fetchJobDetails = async () => {
        try {
            const jobData = await getJob(Number(params.id));
            setJob(jobData);

            const applicationsData = await getJobApplications(Number(params.id));
            setApplications(applicationsData);
        } catch (error) {
            console.error('Error fetching job details:', error);
            toast.error('Failed to fetch job details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseJob = () => {
        setModal({
            isOpen: true,
            action: 'close',
            onConfirm: async () => {
                try {
                    await closeJob(Number(params.id));
                    toast.success('Job closed successfully');
                    fetchJobDetails();
                } catch (error) {
                    console.error('Error closing job:', error);
                    toast.error('Failed to close job');
                } finally {
                    setModal(prev => ({ ...prev, isOpen: false }));
                }
            },
            onCancel: () => setModal(prev => ({ ...prev, isOpen: false }))
        });
    };

    const handleDeleteJob = () => {
        setModal({
            isOpen: true,
            action: 'delete',
            onConfirm: async () => {
                try {
                    await deleteJob(Number(params.id));
                    toast.success('Job deleted successfully');
                    router.push('/dashboard/admin/jobs');
                } catch (error) {
                    console.error('Error deleting job:', error);
                    toast.error('Failed to delete job');
                } finally {
                    setModal(prev => ({ ...prev, isOpen: false }));
                }
            },
            onCancel: () => setModal(prev => ({ ...prev, isOpen: false }))
        });
    };

    const getJobTypeName = (type: JobType) => {
        return ['Full Time', 'Part Time', 'Internship', 'Freelance', 'Contract'][type];
    };

    const getWorkModeName = (mode: WorkMode) => {
        return ['Remote', 'Onsite', 'Hybrid'][mode];
    };

    // Get application status name and color
    const getApplicationStatus = (state: number) => {
        const statuses = [
            { name: 'Pending', bgClass: 'bg-blue-500/20', textClass: 'text-blue-400' },
            { name: 'Shortlisted', bgClass: 'bg-yellow-500/20', textClass: 'text-yellow-400' },
            { name: 'Rejected', bgClass: 'bg-red-500/20', textClass: 'text-red-400' },
            { name: 'Hired', bgClass: 'bg-green-500/20', textClass: 'text-green-400' }
        ];

        return statuses[state] || statuses[0];
    };

    const ConfirmationModal = ({ isOpen, action, onConfirm, onCancel }: ModalProps) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-semibold text-gray-100 mb-4">
                        {action === 'delete' ? 'Delete Job' : 'Close Job'}
                    </h3>
                    <p className="text-gray-300 mb-6">
                        {action === 'delete'
                            ? 'Are you sure you want to delete this job? This action cannot be undone.'
                            : 'Are you sure you want to close this job? This will prevent new applications.'
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Job not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-20 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back to Jobs</span>
                        </button>
                        {job && (
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => router.push(`/dashboard/admin/jobs/editJob/${job.id}`)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-all duration-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span>Edit Job</span>
                                </button>
                                <button
                                    onClick={() => router.push(`/dashboard/admin/applications/jobs/${job.id}`)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all duration-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>View Applications</span>
                                </button>
                                {job.isOpen && !job.expired && (
                                    <button
                                        onClick={handleCloseJob}
                                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-all duration-200"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Close Job</span>
                                    </button>
                                )}
                                <button
                                    onClick={handleDeleteJob}
                                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all duration-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Delete Job</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Job Header Card */}
                {job && (
                    <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl" />
                        <div className="relative bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                            <div className="flex flex-col md:flex-row items-start gap-6">
                                <div className="relative w-20 h-20 md:w-32 md:h-32">
                                    <Image
                                        src={getIPFSGatewayUrl(job.logoCID)}
                                        alt={job.orgName}
                                        fill
                                        className="rounded-2xl object-cover"
                                        sizes="(max-width: 128px) 100vw, 128px"
                                        priority
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h1 className="text-3xl font-bold text-white">{job.title}</h1>
                                        <div className={`px-3 py-1 rounded-full text-sm ${job.expired
                                            ? 'bg-red-500/20 text-red-400'
                                            : job.isOpen
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {job.expired ? 'Expired' : job.isOpen ? 'Active' : 'Closed'}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-4">
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span>{job.orgName}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span>{getJobTypeName(job.jobType)}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>{getWorkModeName(job.workMode)}</span>
                                        </div>


                                        <div className='flex items-center space-x-2'>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                            </svg>
                                            <span className="text-gray-400 text-sm">Wallet:</span>
                                            <div className="flex-1 flex items-center">
                                                <span className="text-purple-400 font-mono text-sm bg-purple-500/20 py-1.5 px-3 rounded-md overflow-x-auto max-w-full whitespace-nowrap">
                                                    {job?.employer}
                                                </span>
                                                <div className="flex items-center ml-2">
                                                    <button
                                                        className="p-1.5 text-gray-400 hover:text-white bg-gray-800/70 hover:bg-gray-700 rounded-md transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(job?.employer || '');
                                                            toast.success('Address copied to clipboard');
                                                        }}
                                                        title="Copy address"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                    <a
                                                        href={`https://etherscan.io/address/${job?.employer}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 ml-1 text-gray-400 hover:text-white bg-gray-800/70 hover:bg-gray-700 rounded-md transition-colors"
                                                        title="View on Etherscan"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-900/50 rounded-xl p-4">
                                            <div className="text-sm text-gray-400 mb-1">Salary Range</div>
                                            <div className="text-lg text-white">${job.minimumSalary} - ${job.maximumSalary}</div>
                                        </div>
                                        <div className="bg-gray-900/50 rounded-xl p-4">
                                            <div className="text-sm text-gray-400 mb-1">Posted</div>
                                            <div className="text-lg text-white">
                                                {formatDistanceToNow(new Date(Number(job.startTime) * 1000), { addSuffix: true })}
                                            </div>
                                        </div>
                                        <div className="bg-gray-900/50 rounded-xl p-4">
                                            <div className="text-sm text-gray-400 mb-1">Applications</div>
                                            <div className="text-lg text-white">{applications.length}</div>
                                        </div>


                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Grid */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description Section */}
                        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                            <h2 className="text-xl font-semibold text-white mb-6">Job Description</h2>
                            <div
                                className="prose prose-invert max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: job?.description || ''
                                }}
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
                                .prose h1 { font-size: 1.875rem; font-weight: 700; }
                                .prose h2 { font-size: 1.5rem; font-weight: 600; }
                                .prose h3 { font-size: 1.25rem; font-weight: 600; }
                                
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
                                .prose a:hover { color: #C4B5FD; }
                                
                                .prose blockquote {
                                    border-left: 4px solid rgba(167, 139, 250, 0.5);
                                    padding-left: 1rem;
                                    margin: 1.5em 0;
                                    color: #9CA3AF;
                                    font-style: italic;
                                }
                                
                                .prose code {
                                    color: #A78BFA;
                                    background: rgba(167, 139, 250, 0.1);
                                    padding: 0.2em 0.4em;
                                    border-radius: 0.25rem;
                                }
                                
                                .prose pre {
                                    background: rgba(0, 0, 0, 0.2);
                                    padding: 1em;
                                    border-radius: 0.5em;
                                    overflow-x: auto;
                                }
                            `}</style>
                        </div>

                        {/* Custom Fields Section */}
                        {job?.customField.length > 0 && (
                            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                                <h2 className="text-xl font-semibold text-white mb-4">Application Requirements</h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {job.customField.map((field, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
                                                <span className="text-gray-300">{field.fieldName}</span>
                                                {field.isRequired ? (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                                                        Required
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">
                                                        Optional
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Additional Job Details Section */}
                        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                            <h2 className="text-xl font-semibold text-white mb-4">Job Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-medium text-gray-400 mb-2">Company</h3>
                                    <div className="bg-gray-900/50 p-4 rounded-xl">
                                        <div className="mb-3">
                                            <p className="text-white font-medium">{job?.orgName}</p>
                                            <p className="text-gray-400 text-sm">{job?.orgEmail}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-400 mb-2">Job Type</h3>
                                    <div className="bg-gray-900/50 p-4 rounded-xl">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-gray-400 text-sm">Type</p>
                                                <p className="text-white">{getJobTypeName(job?.jobType)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm">Mode</p>
                                                <p className="text-white">{getWorkModeName(job?.workMode)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-400 mb-2">Timing</h3>
                                    <div className="bg-gray-900/50 p-4 rounded-xl">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-gray-400 text-sm">Posted On</p>
                                                <p className="text-white">{new Date(Number(job?.startTime) * 1000).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm">Expires On</p>
                                                <p className="text-white">{new Date(Number(job?.expirationTime) * 1000).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-400 mb-2">Compensation</h3>
                                    <div className="bg-gray-900/50 p-4 rounded-xl">
                                        <div>
                                            <p className="text-gray-400 text-sm">Salary Range</p>
                                            <p className="text-white">${job?.minimumSalary} - ${job?.maximumSalary}</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Applications Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-white">Applications</h2>
                                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                                        {applications.length} total
                                    </span>
                                </div>
                                {applications.length > 0 ? (
                                    <div className="space-y-4">
                                        {applications.map((application, index) => (
                                            <div
                                                key={index}
                                                className="bg-gray-900/50 p-4 rounded-xl hover:bg-gray-900/80 transition-colors cursor-pointer group"
                                                onClick={() => router.push(`/dashboard/admin/applications/${job?.id}-${application.applicant}`)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">{application.name}</h3>
                                                        <div className="text-sm text-gray-400">{application.email}</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {application.location && `📍 ${application.location}`}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${getApplicationStatus(Number(application.currentState)).bgClass
                                                            } ${getApplicationStatus(Number(application.currentState)).textClass
                                                            }`}>
                                                            {getApplicationStatus(Number(application.currentState)).name}
                                                        </span>
                                                        <div className="text-xs text-gray-500 mt-2 text-right">
                                                            {formatDistanceToNow(new Date(Number(application.applicationTimestamp) * 1000), { addSuffix: true })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                                                    {application.experience && (
                                                        <div className="text-xs text-gray-400">
                                                            <span className="text-gray-500">Experience:</span> {application.experience}
                                                        </div>
                                                    )}
                                                    <button
                                                        className="ml-auto flex items-center text-sm bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-3 py-1 rounded transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/dashboard/admin/applications/${job?.id}-${application.applicant}`);
                                                        }}
                                                    >
                                                        View Details
                                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-900/30 rounded-xl">
                                        <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-gray-400 mb-1">No applications yet</p>
                                        <p className="text-gray-500 text-sm">Applications will appear here once received</p>
                                        <button
                                            onClick={() => router.push(`/dashboard/admin/applications/jobs/${job.id}`)}
                                            className="mt-4 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg inline-flex items-center"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Manage Applications
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal {...modal} />
        </div>
    );
};

export default withAdminLayout(JobDetails);
