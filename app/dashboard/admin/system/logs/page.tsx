"use client";

import React, { useState } from 'react';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { format } from 'date-fns';

interface LogEntry {
    id: string;
    timestamp: number;
    level: 'info' | 'warning' | 'error';
    message: string;
    source: string;
}

const LogsPage = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState('all');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">System Logs</h1>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 bg-black/20 border border-gray-700 rounded-lg text-gray-300"
                >
                    <option value="all">All Logs</option>
                    <option value="info">Info</option>
                    <option value="warning">Warnings</option>
                    <option value="error">Errors</option>
                </select>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                <div className="space-y-4">
                    {logs.map((log) => (
                        <div
                            key={log.id}
                            className={`p-4 rounded-lg ${log.level === 'error' ? 'bg-red-500/10 border-red-500/20' :
                                    log.level === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                                        'bg-blue-500/10 border-blue-500/20'
                                } border`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <span className={`text-sm font-medium ${log.level === 'error' ? 'text-red-400' :
                                            log.level === 'warning' ? 'text-yellow-400' :
                                                'text-blue-400'
                                        }`}>
                                        {log.level.toUpperCase()}
                                    </span>
                                    <span className="text-gray-400 text-sm ml-2">{log.source}</span>
                                </div>
                                <span className="text-gray-500 text-sm">
                                    {format(log.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                                </span>
                            </div>
                            <p className="text-gray-300">{log.message}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default withAdminLayout(LogsPage); 