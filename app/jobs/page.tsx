"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getIPFSGatewayUrl } from '@/utils/ipfsUpload';
import {
    MagnifyingGlassIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    BriefcaseIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface Job {
    id: string;
    title: string;
    orgName: string;
    location: string;
    salary: string;
    type: string;
    logoCID?: string;
    deadline: number;
    isActive: boolean;
    createdAt: number;
}

const JobsPage = () => {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        location: 'all',
        type: 'all',
        salary: 'all'
    });

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Search and Filter Section */}
                <div className="space-y-4 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-3 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 flex items-center gap-2"
                        >
                            <AdjustmentsHorizontalIcon className="h-5 w-5" />
                            Filters
                        </button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Location</label>
                                <select
                                    value={filters.location}
                                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                >
                                    <option value="all">All Locations</option>
                                    <option value="remote">Remote</option>
                                    <option value="onsite">On-site</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Job Type</label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                >
                                    <option value="all">All Types</option>
                                    <option value="full-time">Full Time</option>
                                    <option value="part-time">Part Time</option>
                                    <option value="contract">Contract</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Salary Range</label>
                                <select
                                    value={filters.salary}
                                    onChange={(e) => setFilters({ ...filters, salary: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                >
                                    <option value="all">All Ranges</option>
                                    <option value="0-50k">$0 - $50k</option>
                                    <option value="50k-100k">$50k - $100k</option>
                                    <option value="100k+">$100k+</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Jobs Grid */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-400">No jobs found</h2>
                        <p className="text-gray-500 mt-2">Try adjusting your search filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => router.push(`/jobs/${job.id}`)}
                                className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-200 cursor-pointer"
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="relative h-12 w-12">
                                        {job.logoCID ? (
                                            <Image
                                                src={getIPFSGatewayUrl(job.logoCID)}
                                                alt={job.orgName}
                                                fill
                                                className="rounded-lg object-cover"
                                                sizes="(max-width: 48px) 100vw, 48px"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                                <BriefcaseIcon className="h-6 w-6 text-purple-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg font-semibold text-white truncate">{job.title}</h2>
                                        <p className="text-purple-400">{job.orgName}</p>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center text-gray-400">
                                        <MapPinIcon className="h-5 w-5 mr-2" />
                                        <span>{job.location}</span>
                                    </div>
                                    <div className="flex items-center text-gray-400">
                                        <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                                        <span>{job.salary}</span>
                                    </div>
                                    <div className="flex items-center text-gray-400">
                                        <BriefcaseIcon className="h-5 w-5 mr-2" />
                                        <span>{job.type}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-sm text-gray-500">
                                        Posted {new Date(job.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className="px-3 py-1 text-sm rounded-full bg-purple-500/20 text-purple-400">
                                        {new Date(job.deadline) > new Date() ? 'Active' : 'Expired'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobsPage;
