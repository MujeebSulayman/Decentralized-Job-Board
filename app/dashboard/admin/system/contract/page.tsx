"use client";

import React, { useState, useEffect } from 'react';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const ContractStatusPage = () => {
    const [contractAddress, setContractAddress] = useState<string>("");
    const [ownerAddress, setOwnerAddress] = useState<string>("");
    const [isConnected, setIsConnected] = useState(false);
    const [balance, setBalance] = useState<string>("0");

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Smart Contract Status</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contract Info */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Contract Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400">Contract Address</label>
                            <div className="text-white font-mono bg-black/20 p-2 rounded mt-1">
                                {contractAddress || 'Not available'}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Owner Address</label>
                            <div className="text-white font-mono bg-black/20 p-2 rounded mt-1">
                                {ownerAddress || 'Not available'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contract Status */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h2 className="text-lg font-semibold text-white mb-4">Status</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Connection Status</span>
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
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Contract Balance</span>
                            <span className="text-white font-medium">{balance} ETH</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withAdminLayout(ContractStatusPage); 