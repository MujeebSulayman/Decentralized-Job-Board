"use client";

import React, { useState, useEffect } from 'react';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { toast } from 'react-toastify';

const ServiceFeesPage = () => {
    const [currentFee, setCurrentFee] = useState<string>("5"); // Default 5%
    const [newFee, setNewFee] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Service Fee Management</h1>

            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4">Current Service Fee</h2>
                    <div className="text-3xl font-bold text-green-400">{currentFee}%</div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white">Update Service Fee</h2>
                    <div className="flex gap-4">
                        <input
                            type="number"
                            value={newFee}
                            onChange={(e) => setNewFee(e.target.value)}
                            placeholder="Enter new fee percentage"
                            className="flex-1 px-4 py-2 bg-black/20 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            min="0"
                            max="100"
                        />
                        <button
                            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-200"
                            disabled={isLoading}
                        >
                            Update Fee
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withAdminLayout(ServiceFeesPage); 