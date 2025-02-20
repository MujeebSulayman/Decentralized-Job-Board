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
                // Initialize custom field responses array with empty strings
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
            await ethereum.request({ method: 'eth_requestAccounts' });
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

        // Validate all required fields first
        if (!formData.name.trim() || !formData.email.trim() || !formData.phoneNumber.trim() || !formData.location.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Validate required custom fields
        const hasInvalidRequiredFields = job.customField.some((field, index) => {
            return field.isRequired && !customFieldResponses[index]?.trim();
        });

        if (hasInvalidRequiredFields) {
            toast.error('Please fill in all required additional requirements');
            return;
        }

        setIsSubmitting(true);
        const processingToast = toast.loading('Preparing your application...');

        try {
            // Upload CV first
            toast.update(processingToast, {
                render: 'Uploading CV...',
                type: 'info',
                isLoading: true
            });

            const { cid: cvCID } = await uploadToIPFS(formData.cv);

            toast.update(processingToast, {
                render: 'CV uploaded successfully, submitting application...',
                type: 'info',
                isLoading: true
            });

            // Prepare field responses - ensure array matches contract expectations
            const fieldResponses = new Array(job.customField.length).fill('').map((_, index) => {
                const response = customFieldResponses[index]?.trim() || '';
                // Contract requires non-empty strings for required fields
                if (job.customField[index].isRequired && !response) {
                    throw new Error(`${job.customField[index].fieldName} is required`);
                }
                // Return response or space (contract doesn't accept empty strings)
                return response || ' ';
            });

            // Submit application with proper parameter order matching the contract
            await applyForJob(
                Number(params.id),
                formData.name.trim(),
                formData.email.trim(),
                formData.phoneNumber.trim(),
                formData.location.trim(),
                fieldResponses, // Must be array of strings matching customField length
                cvCID
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
                        <p className="text-gray-400">Please connect your wallet to apply for this job</p>
                    </div>
                    <button
                        onClick={connectWallet}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Connect Wallet</span>
                    </button>
                    <p className="text-sm text-gray-500 text-center mt-4">
                        New to Web3? {' '}
                        <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
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
                <button onClick={() => router.back()} className="flex items-center text-gray-400 hover:text-white mb-6">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Back to Job
                </button>

                <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
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

                        {/* CV Upload Section */}
                        <div className="bg-black/20 rounded-lg p-6 border border-gray-700">
                            <div className="flex items-center mb-4">
                                <DocumentArrowUpIcon className="h-5 w-5 text-purple-400 mr-2" />
                                <h2 className="text-lg font-semibold">CV Upload</h2>
                            </div>

                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    required={!formData.cv}
                                    name="cv-upload"
                                    id="cv-upload"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 5 * 1024 * 1024) {
                                                toast.error('File size must be less than 5MB');
                                                return;
                                            }

                                            try {
                                                setCvUploadStatus({
                                                    ...cvUploadStatus,
                                                    isUploading: true,
                                                    error: null,
                                                    fileName: file.name,
                                                    progress: 0
                                                });

                                                setFormData({ ...formData, cv: file });

                                                toast.success('CV selected successfully');
                                            } catch (error: any) {
                                                toast.error(error.message || 'Failed to process CV');
                                                setCvUploadStatus({
                                                    isUploading: false,
                                                    progress: 0,
                                                    error: error.message || 'Failed to upload file',
                                                    fileName: null
                                                });
                                                setFormData({ ...formData, cv: null });
                                            }
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="cv-upload"
                                    className={`flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer
                                        ${formData.cv ? 'border-purple-500/50 bg-purple-500/5' : 'border-gray-700 hover:border-purple-500/50 hover:bg-purple-500/5'}
                                        transition-all duration-200`}
                                >
                                    {formData.cv ? (
                                        <div className="flex items-center space-x-3">
                                            <DocumentTextIcon className="h-6 w-6 text-purple-400" />
                                            <span className="text-gray-300">{formData.cv.name}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setFormData({ ...formData, cv: null });
                                                    setCvUploadStatus({
                                                        isUploading: false,
                                                        progress: 0,
                                                        error: null,
                                                        fileName: null
                                                    });
                                                }}
                                                className="text-gray-500 hover:text-red-400 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-500 mb-3" />
                                            <div className="text-gray-300 font-medium">Drop your CV here or click to upload</div>
                                            <p className="text-gray-500 text-sm mt-1">Supports PDF, DOC, DOCX (Max 5MB)</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {cvUploadStatus.error && (
                                <div className="mt-2 text-red-400 text-sm flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {cvUploadStatus.error}
                                </div>
                            )}

                            {cvUploadStatus.isUploading && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                                        <span>Uploading...</span>
                                        <span>{cvUploadStatus.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                                        <div
                                            className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${cvUploadStatus.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Custom Fields Section */}
                        {job.customField.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">Additional Requirements</h2>
                                {job.customField.map((field, index) => (
                                    <div key={index}>
                                        <label className="block text-gray-300 mb-2">
                                            {field.fieldName}
                                            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
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
                                            className="w-full px-4 py-2 bg-black/20 rounded-lg border border-gray-700 focus:border-purple-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JobApplicationPage;
