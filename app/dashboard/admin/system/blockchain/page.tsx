"use client";

import React, { useState } from 'react';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { CubeIcon, CircleStackIcon } from '@heroicons/react/24/solid';

const BlockchainPage = () => {
    const [networkInfo, setNetworkInfo] = useState({
        chainId: "",
        networkName: "",
        latestBlock: 0,
        gasPrice: "0",
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Blockchain Information</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Network Info */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Network Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400">Network Name</label>
                            <div className="text-white font-mono bg-black/20 p-2 rounded mt-1">
                                {networkInfo.networkName || 'Not connected'}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Chain ID</label>
                            <div className="text-white font-mono bg-black/20 p-2 rounded mt-1">
                                {networkInfo.chainId || 'Not available'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blockchain Stats */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Blockchain Stats</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Latest Block</span>
                            <div className="flex items-center text-blue-400">
                                <CubeIcon className="h-5 w-5 mr-2" />
                                <span>{networkInfo.latestBlock}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Gas Price</span>
                            <div className="flex items-center text-purple-400">
                                <CircleStackIcon className="h-5 w-5 mr-2" />
                                <span>{networkInfo.gasPrice} Gwei</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withAdminLayout(BlockchainPage); 