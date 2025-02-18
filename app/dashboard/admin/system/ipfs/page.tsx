"use client";

import React, { useState } from 'react';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { CheckCircleIcon, XCircleIcon, CloudIcon } from '@heroicons/react/24/solid';

const IPFSStatusPage = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [gateway, setGateway] = useState("https://ipfs.io");
    const [pinningService, setPinningService] = useState("Pinata");
    const [totalPinned, setTotalPinned] = useState(0);
    const [storageUsed, setStorageUsed] = useState("0 MB");

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">IPFS Status</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* IPFS Connection Status */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Connection Status</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">IPFS Gateway</span>
                            {isConnected ? (
                                <div className="flex items-center text-green-400">
                                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                                    Connected
                                </div>
                            ) : (
                                <div className="flex items-center text-red-400">
                                    <XCircleIcon className="h-5 w-5 mr-1" />
                                    Disconnected
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Gateway URL</label>
                            <div className="text-white font-mono bg-black/20 p-2 rounded mt-1">
                                {gateway}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Storage Stats */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Storage Statistics</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Pinning Service</span>
                            <span className="text-white">{pinningService}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Total Files Pinned</span>
                            <span className="text-white">{totalPinned}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Storage Used</span>
                            <span className="text-white">{storageUsed}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withAdminLayout(IPFSStatusPage); 