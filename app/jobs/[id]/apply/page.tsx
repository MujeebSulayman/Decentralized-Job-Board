"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { getJob, applyForJob } from '@/services/blockchain';
import { uploadToIPFS, getIPFSGatewayUrl } from '@/utils/ipfsUpload';
import { JobStruct } from '@/utils/type.dt';
import {
    BuildingOfficeIcon,
    DocumentTextIcon,
    ArrowLeftIcon,
    BriefcaseIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

const JobApplicationPage = () => {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState<JobStruct | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        location: '',
        cv: null as File | null,
    });
    const [customFieldResponses, setCustomFieldResponses] = useState<string[]>([]);
    const [cvUploadStatus, setCvUploadStatus] = useState({
        isUploading: false,
        progress: 0,
        error: null as string | null,
        fileName: null as string | null
    });
    const [isWalletConnected, setIsWalletConnected] = useState(false);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                if (!params.id) return;
                const jobData = await getJob(Number(params.id));
                setJob(jobData);
                setCustomFieldResponses(new Array(jobData.customField.length).fill(''));
            } catch (error) {
                console.error('Error:', error);
                toast.error('Failed to load job details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchJob();
    }, [params.id]);

    useEffect(() => {
        const checkWallet = async () => {
            try {
                const { ethereum } = window;
                if (!ethereum) {
                    setIsWalletConnected(false);
                    return;
                }

                const accounts = await ethereum.request({ method: 'eth_accounts' });
                setIsWalletConnected(accounts && accounts.length > 0);
            } catch (error) {
                console.error('Error checking wallet:', error);
                setIsWalletConnected(false);
            }
        };

        checkWallet();
        window.ethereum?.on('accountsChanged', checkWallet);

        return () => {
            window.ethereum?.removeListener('accountsChanged', checkWallet);
        };
    }, []);

    const connectWallet = async () => {
        try {
            const { ethereum } = window;
            if (!ethereum) {
                toast.error('Please install MetaMask to apply for jobs');
                return;
            }

            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            setIsWalletConnected(true);
            toast.success('Wallet connected successfully!');
        } catch (error) {
            console.error('Error connecting wallet:', error);
            toast.error('Failed to connect wallet');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job || !formData.cv || !params.id) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        const processingToast = toast.loading('Submitting application...');

        try {
            // Upload CV first
            const { cid } = await uploadToIPFS(formData.cv);

            // Prepare custom field responses
            // If there are no custom fields, send an empty array
            const responses = job.customField && job.customField.length > 0
                ? job.customField.map((field, index) => customFieldResponses[index] || '')
                : [];

            // Submit application with CV CID
            const receipt = await applyForJob(
                Number(params.id),
                formData.name,
                formData.email,
                formData.phoneNumber,
                formData.location,
                cid,
                responses // Pass the properly formatted responses array
            );

            toast.update(processingToast, {
                render: 'Application submitted successfully!',
                type: 'success',
                isLoading: false,
                autoClose: 2000
            });
            router.push(`/jobs/${params.id}`);
        } catch (error: any) {
            console.error('Error:', error);
            toast.update(processingToast, {
                render: error.message || 'Failed to submit application',
                type: 'error',
                isLoading: false,
                autoClose: 4000
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isWalletConnected) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 max-w-md w-full mx-4">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                        <p className="text-gray-400">
                            Please connect your wallet to apply for this job
                        </p>
                    </div>
                    <button
                        onClick={connectWallet}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                        <span>Connect Wallet</span>
                    </button>
                    <p className="text-sm text-gray-500 text-center mt-4">
                        New to Web3? {' '}
                        <a
                            href="https://metamask.io/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300"
                        >
                            Get MetaMask →
                        </a>
                    </p>
                </div>
            </div>
        );
    }

    if (isLoading) return <LoadingState />;
    if (!job) return <NotFoundState />;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-400 hover:text-white mb-6"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Back to Job
                </button>

                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 relative">
                            {job.logoCID ? (
                                <Image
                                    src={getIPFSGatewayUrl(job.logoCID)}
                                    alt={job.orgName}
                                    fill
                                    className="rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gray-700 rounded-lg" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">{job.title}</h1>
                            <p className="text-gray-400">{job.orgName}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* CV Upload Section - First and Most Important */}
                        <div className="bg-black/20 rounded-lg p-6 border border-gray-700">
                            <h2 className="text-lg font-semibold mb-4">Upload Your CV</h2>
                            <input
                                type="file"
                                required
                                accept=".pdf,.doc,.docx"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    setCvUploadStatus({
                                        isUploading: true,
                                        progress: 0,
                                        error: null,
                                        fileName: file.name
                                    });

                                    const uploadToast = toast.loading('Preparing CV for upload...');

                                    try {
                                        // Validate file size and type
                                        if (file.size > 5 * 1024 * 1024) {
                                            throw new Error('File size must be less than 5MB');
                                        }

                                        const validTypes = [
                                            'application/pdf',
                                            'application/msword',
                                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                        ];

                                        if (!validTypes.includes(file.type)) {
                                            throw new Error('Please upload a PDF or Word document');
                                        }

                                        // Simulate upload progress
                                        const progressInterval = setInterval(() => {
                                            setCvUploadStatus(prev => ({
                                                ...prev,
                                                progress: Math.min(prev.progress + 10, 90)
                                            }));
                                        }, 200);

                                        // Set the file in form state
                                        setFormData({ ...formData, cv: file });

                                        clearInterval(progressInterval);
                                        setCvUploadStatus(prev => ({ ...prev, progress: 100 }));

                                        toast.update(uploadToast, {
                                            render: 'CV ready for submission!',
                                            type: 'success',
                                            isLoading: false,
                                            autoClose: 2000
                                        });
                                    } catch (error: any) {
                                        setCvUploadStatus(prev => ({
                                            ...prev,
                                            error: error.message
                                        }));
                                        toast.update(uploadToast, {
                                            render: error.message,
                                            type: 'error',
                                            isLoading: false,
                                            autoClose: 4000
                                        });
                                        setFormData(prev => ({ ...prev, cv: null }));
                                    } finally {
                                        setCvUploadStatus(prev => ({
                                            ...prev,
                                            isUploading: false
                                        }));
                                    }
                                }}
                                className="hidden"
                                id="cv-upload"
                            />
                            <label
                                htmlFor="cv-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 cursor-pointer transition-colors relative"
                            >
                                {cvUploadStatus.isUploading ? (
                                    <div className="text-center">
                                        <DocumentArrowUpIcon className="h-8 w-8 text-purple-500 mx-auto mb-2 animate-pulse" />
                                        <p className="text-purple-500">Uploading... {cvUploadStatus.progress}%</p>
                                        <div className="w-48 h-1 bg-gray-700 rounded-full mt-2 mx-auto overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 transition-all duration-300"
                                                style={{ width: `${cvUploadStatus.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : formData.cv ? (
                                    <div className="text-center">
                                        <DocumentArrowUpIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                                        <p className="text-purple-500">{cvUploadStatus.fileName}</p>
                                        <p className="text-gray-500 text-sm mt-1">Click to change file</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <DocumentArrowUpIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-400">Click to upload your CV</p>
                                        <p className="text-gray-500 text-sm">PDF, DOC, DOCX (Max. 5MB)</p>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Additional Requirements Section - Only show if valid requirements exist */}
                        {job.customField &&
                            job.customField.length > 0 &&
                            job.customField.some(field => field.fieldName && field.fieldName.trim()) && (
                                <div className="bg-black/20 rounded-lg p-6 border border-gray-700">
                                    <h2 className="text-lg font-semibold mb-4">Additional Requirements</h2>
                                    <div className="space-y-4">
                                        {job.customField
                                            .filter(field => field.fieldName && field.fieldName.trim())
                                            .map((field, index) => (
                                                <div key={index} className="space-y-2">
                                                    <label className="block text-gray-300">
                                                        {field.fieldName}
                                                        {field.isRequired && (
                                                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                                                                Required
                                                            </span>
                                                        )}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required={field.isRequired}
                                                        value={customFieldResponses[index]}
                                                        onChange={(e) => {
                                                            const newResponses = [...customFieldResponses];
                                                            newResponses[index] = e.target.value;
                                                            setCustomFieldResponses(newResponses);
                                                        }}
                                                        className="w-full px-4 py-3 bg-black/20 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent"
                                                        placeholder={`Enter your response for ${field.fieldName}`}
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-black/20 rounded-lg border border-gray-700 focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-black/20 rounded-lg border border-gray-700 focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full px-4 py-2 bg-black/20 rounded-lg border border-gray-700 focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2">Location</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-2 bg-black/20 rounded-lg border border-gray-700 focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const LoadingState = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
);

const NotFoundState = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-400">Job Not Found</h2>
            <p className="text-gray-500 mt-2">The job you're looking for doesn't exist.</p>
        </div>
    </div>
);

export default JobApplicationPage;
