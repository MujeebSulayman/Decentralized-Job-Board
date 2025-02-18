"use client";

import React, { useState } from 'react';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { format } from 'date-fns';

interface Transaction {
    id: string;
    type: 'job_posting' | 'withdrawal';
    amount: string;
    timestamp: number;
    status: 'completed' | 'pending' | 'failed';
    from: string;
    to: string;
}

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Transactions</h1>

            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-400 text-sm">
                                <th className="px-6 py-3">Transaction ID</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">From</th>
                                <th className="px-6 py-3">To</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="text-gray-300">
                                    <td className="px-6 py-4">{tx.id}</td>
                                    <td className="px-6 py-4">{tx.type}</td>
                                    <td className="px-6 py-4">{tx.amount} ETH</td>
                                    <td className="px-6 py-4">
                                        {format(tx.timestamp * 1000, 'MMM dd, yyyy HH:mm')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`
                      px-2 py-1 rounded-full text-xs
                      ${tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'}
                    `}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{`${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`}</td>
                                    <td className="px-6 py-4">{`${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default withAdminLayout(TransactionsPage); 