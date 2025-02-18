"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getIPFSGatewayUrl } from '@/utils/ipfsUpload';
import { getAllJobs } from '@/services/blockchain';
import { JobStruct, WorkMode, JobType } from '@/utils/type.dt';
import {
    BuildingOfficeIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    BriefcaseIcon,
    ChevronLeftIcon,
    CalendarIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const EmployerJobsPage = () => {
    const params = useParams();
    const router = useRouter();
    const [jobs, setJobs] = useState<JobStruct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const address = params.address as string;

    useEffect(() => {
        const fetchEmployerJobs = async () => {
            try {
                const allJobs = await getAllJobs();
                const employerJobs = allJobs.filter(job =>
                    job.employer.toLowerCase() === address.toLowerCase()
                );
                setJobs(employerJobs);
            } catch (error) {
                console.error('Error fetching employer jobs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmployerJobs();
    }, [address]);

    if (isLoading) return <LoadingState />;
    if (jobs.length === 0) return <NotFoundState />;

    const activeJobs = jobs.filter(job => job.isOpen && !job.expired);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => router.back()}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronLeftIcon className="h-6 w-6" />
                        </button>
                        <div className="flex items-center space-x-4">
                            <div className="relative w-16 h-16">
                                {jobs[0].logoCID ? (
                                    <Image
                                        src={getIPFSGatewayUrl(jobs[0].logoCID)}
                                        alt={jobs[0].orgName}
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
                                <h1 className="text-2xl font-bold">{jobs[0].orgName}</h1>
                                <div className="flex items-center space-x-2 text-gray-400">
                                    <span>{jobs.length} Total Jobs</span>
                                    <span>•</span>
                                    <span>{activeJobs.length} Active</span>
                                    <span>•</span>
                                    <span className="font-mono text-sm">
                                        {`${address.slice(0, 6)}...${address.slice(-4)}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Jobs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                        <div
                            key={job.id}
                            onClick={() => router.push(`/jobs/${job.id}`)}
                            className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-200 cursor-pointer"
                        >
                            <h2 className="text-xl font-semibold mb-4">{job.title}</h2>
                            <div className="space-y-3">
                                <div className="flex items-center text-gray-400">
                                    <MapPinIcon className="h-5 w-5 mr-2" />
                                    <span>{WorkMode[job.workMode]}</span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                                    <span>${job.minimumSalary} - ${job.maximumSalary}</span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                    <BriefcaseIcon className="h-5 w-5 mr-2" />
                                    <span>{JobType[job.jobType]}</span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                    <CalendarIcon className="h-5 w-5 mr-2" />
                                    <span>Posted {formatDistanceToNow(new Date(Number(job.startTime) * 1000), { addSuffix: true })}</span>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                                <span className="text-sm text-gray-400">
                                    {job.customField.length > 0 ? `${job.customField.length} requirements` : 'No requirements'}
                                </span>
                                <span className={`px-3 py-1 text-sm rounded-full ${!job.expired && job.isOpen
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {!job.expired && job.isOpen ? 'Active' : 'Closed'}
                                </span>
                            </div>
                        </div>
                    ))}
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
            <h2 className="text-2xl font-bold text-gray-400">No jobs found</h2>
            <p className="text-gray-500 mt-2">This employer hasn't posted any jobs yet.</p>
        </div>
    </div>
);

export default EmployerJobsPage; 