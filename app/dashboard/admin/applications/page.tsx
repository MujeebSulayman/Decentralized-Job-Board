"use client";

import React, { useState } from 'react';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { ClipboardDocumentCheckIcon, EnvelopeIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import Image from 'next/image';
import { getIPFSGatewayUrl } from '@/utils/ipfsUpload';

interface Application {
    id: string;
    jobId: string;
    jobTitle: string;
    applicantAddress: string;
    applicantName: string;
    email: string;
    cvCID: string;
    status: 'submitted' | 'reviewed' | 'accepted' | 'rejected';
    appliedAt: number;
    employerName: string;
    employerLogo?: string;
}

const ApplicationsPage: React.FC = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Applications Management</h1>
                <div className="flex gap-4">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 bg-black/20 border border-gray-700 rounded-lg text-gray-300"
                    >
                        <option value="all">All Applications</option>
                        <option value="submitted">Submitted</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-400 text-sm">
                                <th className="px-6 py-3">Job Details</th>
                                <th className="px-6 py-3">Applicant</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Applied</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {applications.map((application) => (
                                <tr key={application.id} className="text-gray-300">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {application.employerLogo ? (
                                                <Image
                                                    src={getIPFSGatewayUrl(application.employerLogo)}
                                                    alt={application.employerName}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full mr-3"
                                                />
                                            ) : (
                                                <ClipboardDocumentCheckIcon className="h-8 w-8 text-gray-400 mr-3" />
                                            )}
                                            <div>
                                                <div className="font-medium">{application.jobTitle}</div>
                                                <div className="text-sm text-gray-500">{application.employerName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium">{application.applicantName}</div>
                                            <div className="text-sm text-gray-500">{application.email}</div>
                                            <div className="text-xs text-gray-500 font-mono">
                                                {`${application.applicantAddress.slice(0, 6)}...${application.applicantAddress.slice(-4)}`}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            application.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                                            application.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                            application.status === 'reviewed' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {format(application.appliedAt, 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-3">
                                            <button 
                                                className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                                                title="View CV"
                                            >
                                                <ClipboardDocumentCheckIcon className="h-5 w-5" />
                                            </button>
                                            <button 
                                                className="p-2 text-purple-400 hover:text-purple-300 transition-colors"
                                                title="Send Email"
                                            >
                                                <EnvelopeIcon className="h-5 w-5" />
                                            </button>
                                            {application.status === 'submitted' && (
                                                <>
                                                    <button 
                                                        className="p-2 text-green-400 hover:text-green-300 transition-colors"
                                                        title="Accept Application"
                                                    >
                                                        <CheckCircleIcon className="h-5 w-5" />
                                                    </button>
                                                    <button 
                                                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                                                        title="Reject Application"
                                                    >
                                                        <XMarkIcon className="h-5 w-5" />
                                                    </button>
                                                </>
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

export default withAdminLayout(ApplicationsPage); 