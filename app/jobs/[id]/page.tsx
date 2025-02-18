"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { getIPFSGatewayUrl } from '@/utils/ipfsUpload';
import {
    CalendarIcon,
    CurrencyDollarIcon,
    MapPinIcon,
    ClockIcon,
    BriefcaseIcon
} from '@heroicons/react/24/outline';

interface JobDetails {
    id: string;
    title: string;
    orgName: string;
    location: string;
    salary: string;
    type: string;
    duration: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    logoCID?: string;
    deadline: number;
    isActive: boolean;
    customFields: Array<{
        fieldName: string;
        isRequired: boolean;
    }>;
}

const JobDetailsPage = () => {
    const params = useParams();
    const [job, setJob] = useState<JobDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : job ? (
                    <div className="space-y-8">
                        {/* Job Header */}
                        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                            <div className="flex flex-col md:flex-row items-start gap-6">
                                <div className="relative w-20 h-20 md:w-32 md:h-32">
                                    {job.logoCID && (
                                        <Image
                                            src={getIPFSGatewayUrl(job.logoCID)}
                                            alt={job.orgName}
                                            fill
                                            className="rounded-2xl object-cover"
                                            sizes="(max-width: 128px) 100vw, 128px"
                                        />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
                                    <p className="text-purple-400 text-lg mb-4">{job.orgName}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="flex items-center text-gray-300">
                                            <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                                            {job.location}
                                        </div>
                                        <div className="flex items-center text-gray-300">
                                            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-400" />
                                            {job.salary}
                                        </div>
                                        <div className="flex items-center text-gray-300">
                                            <BriefcaseIcon className="h-5 w-5 mr-2 text-gray-400" />
                                            {job.type}
                                        </div>
                                        <div className="flex items-center text-gray-300">
                                            <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                                            {job.duration}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                    <button className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors duration-200">
                                        Apply Now
                                    </button>
                                    <div className="text-sm text-gray-400 flex items-center justify-center">
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Job Description */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                                    <h2 className="text-xl font-semibold mb-4">Job Description</h2>
                                    <div className="prose prose-invert max-w-none">
                                        {job.description}
                                    </div>
                                </div>

                                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                                    <h2 className="text-xl font-semibold mb-4">Requirements</h2>
                                    <ul className="list-disc list-inside space-y-2 text-gray-300">
                                        {job.requirements.map((req, index) => (
                                            <li key={index}>{req}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                                    <h2 className="text-xl font-semibold mb-4">Responsibilities</h2>
                                    <ul className="list-disc list-inside space-y-2 text-gray-300">
                                        {job.responsibilities.map((resp, index) => (
                                            <li key={index}>{resp}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Custom Fields */}
                                {job.customFields.length > 0 && (
                                    <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                                        <h2 className="text-xl font-semibold mb-4">Additional Requirements</h2>
                                        <div className="space-y-4">
                                            {job.customFields.map((field, index) => (
                                                <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
                                                    <span className="text-gray-300">{field.fieldName}</span>
                                                    {field.isRequired && (
                                                        <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                                                            Required
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-400">Job not found</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobDetailsPage; 