"use client";

import React, { useState } from 'react';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { UserCircleIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface User {
    id: string;
    address: string;
    role: 'employer' | 'user';
    isVerified: boolean;
    joinedAt: number;
    totalJobs?: number;
    totalApplications?: number;
}

const UsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 bg-black/20 border border-gray-700 rounded-lg text-gray-300"
                >
                    <option value="all">All Users</option>
                    <option value="employer">Employers</option>
                    <option value="user">Job Seekers</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                </select>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-400 text-sm">
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Joined</th>
                                <th className="px-6 py-3">Activity</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {users.map((user) => (
                                <tr key={user.id} className="text-gray-300">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3" />
                                            <div>
                                                <div className="font-medium">{`${user.address.slice(0, 6)}...${user.address.slice(-4)}`}</div>
                                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'employer'
                                                ? 'bg-purple-500/20 text-purple-400'
                                                : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.isVerified ? (
                                            <div className="flex items-center text-green-400">
                                                <CheckCircleIcon className="h-5 w-5 mr-1" />
                                                Verified
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-yellow-400">
                                                <XMarkIcon className="h-5 w-5 mr-1" />
                                                Pending
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {new Date(user.joinedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            {user.role === 'employer' ? (
                                                <div>Jobs Posted: {user.totalJobs}</div>
                                            ) : (
                                                <div>Applications: {user.totalApplications}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-blue-400 hover:text-blue-300 mr-3">
                                            View
                                        </button>
                                        {!user.isVerified && (
                                            <button className="text-green-400 hover:text-green-300">
                                                Verify
                                            </button>
                                        )}
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

export default withAdminLayout(UsersPage); 