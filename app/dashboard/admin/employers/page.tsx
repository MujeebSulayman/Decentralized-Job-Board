"use client";

import React, { useState } from 'react';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { BuildingOfficeIcon, CheckBadgeIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

interface Employer {
    id: string;
    address: string;
    orgName: string;
    email: string;
    isVerified: boolean;
    joinedAt: number;
    totalJobs: number;
    activeJobs: number;
    logo?: string;
}

const EmployersPage: React.FC = () => {
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Employer Management</h1>
                <div className="flex gap-4">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 bg-black/20 border border-gray-700 rounded-lg text-gray-300"
                    >
                        <option value="all">All Employers</option>
                        <option value="verified">Verified</option>
                        <option value="pending">Pending Verification</option>
                        <option value="active">With Active Jobs</option>
                    </select>
                </div>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-400 text-sm">
                                <th className="px-6 py-3">Organization</th>
                                <th className="px-6 py-3">Wallet Address</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Jobs</th>
                                <th className="px-6 py-3">Joined</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {employers.map((employer) => (
                                <tr key={employer.id} className="text-gray-300">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {employer.logo ? (
                                                <img 
                                                    src={employer.logo} 
                                                    alt={employer.orgName}
                                                    className="h-8 w-8 rounded-full mr-3"
                                                />
                                            ) : (
                                                <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mr-3" />
                                            )}
                                            <div>
                                                <div className="font-medium">{employer.orgName}</div>
                                                <div className="text-sm text-gray-500">{employer.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm">
                                        {`${employer.address.slice(0, 6)}...${employer.address.slice(-4)}`}
                                    </td>
                                    <td className="px-6 py-4">
                                        {employer.isVerified ? (
                                            <div className="flex items-center text-green-400">
                                                <CheckBadgeIcon className="h-5 w-5 mr-1" />
                                                Verified
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-yellow-400">
                                                <XCircleIcon className="h-5 w-5 mr-1" />
                                                Pending
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="text-sm">
                                                Total: <span className="text-purple-400">{employer.totalJobs}</span>
                                            </div>
                                            <div className="text-sm">
                                                Active: <span className="text-green-400">{employer.activeJobs}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {format(employer.joinedAt, 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-3">
                                            <button 
                                                className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                                title="View Details"
                                            >
                                                <EyeIcon className="h-5 w-5" />
                                            </button>
                                            {!employer.isVerified && (
                                                <button 
                                                    className="p-2 text-green-400 hover:text-green-300 transition-colors"
                                                    title="Verify Employer"
                                                >
                                                    <CheckBadgeIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default withAdminLayout(EmployersPage); 