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
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

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

            // Submit application with CV CID
            const receipt = await applyForJob(
                Number(params.id),
                formData.name,
                formData.email,
                formData.phoneNumber,
                formData.location,
                cid,
                customFieldResponses
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

                                    // Validate file type correctly
                                    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                                    if (!validTypes.includes(file.type)) {
                                        toast.error('Please upload a PDF or Word document');
                                        return;
                                    }

                                    // Validate file size
                                    if (file.size > 5 * 1024 * 1024) {
                                        toast.error('File size must be less than 5MB');
                                        return;
                                    }

                                    setIsUploading(true);
                                    setUploadProgress(0);

                                    const uploadToast = toast.loading('Preparing CV for upload...');

                                    // Simulate upload progress
                                    const progressInterval = setInterval(() => {
                                        setUploadProgress(prev => Math.min(prev + 10, 90));
                                        toast.update(uploadToast, {
                                            render: `Uploading CV... ${Math.min(uploadProgress + 10, 90)}%`
                                        });
                                    }, 200);

                                    try {
                                        setFormData({ ...formData, cv: file });

                                        toast.update(uploadToast, {
                                            render: 'CV uploaded successfully!',
                                            type: 'success',
                                            isLoading: false,
                                            autoClose: 2000
                                        });
                                    } catch (error) {
                                        toast.update(uploadToast, {
                                            render: 'Failed to upload CV',
                                            type: 'error',
                                            isLoading: false,
                                            autoClose: 4000
                                        });
                                    } finally {
                                        clearInterval(progressInterval);
                                        setUploadProgress(100);
                                        setIsUploading(false);
                                    }
                                }}
                                className="hidden"
                                id="cv-upload"
                            />
                            <label
                                htmlFor="cv-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 cursor-pointer transition-colors relative"
                            >
                                {isUploading ? (
                                    <div className="text-center">
                                        <DocumentArrowUpIcon className="h-8 w-8 text-purple-500 mx-auto mb-2 animate-pulse" />
                                        <p className="text-purple-500">Uploading... {uploadProgress}%</p>
                                        <div className="w-48 h-1 bg-gray-700 rounded-full mt-2 mx-auto overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : formData.cv ? (
                                    <div className="text-center">
                                        <DocumentArrowUpIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                                        <p className="text-purple-500">{formData.cv.name}</p>
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

                        {/* Custom Fields */}
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
