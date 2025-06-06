"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { getJob, getJobApplications, closeJob } from '@/services/blockchain';
import { JobStruct, ApplicationStruct, JobType, WorkMode } from '@/utils/type.dt';
import Image from 'next/image';
import withEmployerlayout from '@/components/hoc/withEmployerlayout';
import { formatDistanceToNow } from 'date-fns';
import { getIPFSGatewayUrl } from '@/utils/ipfsUpload';

interface ModalProps {
    isOpen: boolean;
    action: 'close' | null;
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

    const getJobTypeName = (type: JobType) => {
        return ['Full Time', 'Part Time', 'Internship', 'Freelance', 'Contract'][type];
    };

    const getWorkModeName = (mode: WorkMode) => {
        return ['Remote', 'Onsite', 'Hybrid'][mode];
    };

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
                    <h3 className="text-xl font-semibold text-gray-100 mb-4">Close Job</h3>
                    <p className="text-gray-300 mb-6">
                        Are you sure you want to close this job? This will prevent new applications.
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
                            className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors duration-200"
                        >
                            Close
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
                                    onClick={() => router.push(`/dashboard/employer/jobs/editJob/${job.id}`)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-all duration-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span>Edit Job</span>
                                </button>
                                <button
                                    onClick={() => router.push(`/dashboard/employer/applications/jobs/${job.id}`)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all duration-200"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>View Applications</span>
                                    {applications.length > 0 && (
                                        <span className="ml-1 bg-blue-500/30 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                                            {applications.length}
                                        </span>
                                    )}
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
                                    <div className="flex flex-wrap gap-4 text-gray-400 mb-4">
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span>{job.orgName}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{getJobTypeName(job.jobType)}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span>{getWorkModeName(job.workMode)}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>${job.minimumSalary} - ${job.maximumSalary}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-sm text-gray-400">
                                        Posted {formatDistanceToNow(new Date(Number(job.startTime) * 1000))} ago
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {applications.length} application{applications.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Job Description */}
                <div className="mt-8">
                    <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4">Job Description</h2>
                        <div className="prose prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: job.description }} />
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal {...modal} />
        </div>
    );
};

export default withEmployerlayout(JobDetails); 