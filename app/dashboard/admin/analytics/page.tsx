"use client";

import React from 'react';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { ChartBarIcon, TrendingUpIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';

const AnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Analytics Dashboard</h1>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Job Metrics Card */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Job Metrics</h3>
            <ChartBarIcon className="h-6 w-6 text-blue-400" />
          </div>
          {/* Add job metrics visualization */}
        </div>

        {/* User Growth Card */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">User Growth</h3>
            <TrendingUpIcon className="h-6 w-6 text-green-400" />
          </div>
          {/* Add user growth visualization */}
        </div>

        {/* Revenue Analytics Card */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Revenue</h3>
            <CurrencyDollarIcon className="h-6 w-6 text-yellow-400" />
          </div>
          {/* Add revenue visualization */}
        </div>
      </div>
    </div>
  );
};

export default withAdminLayout(AnalyticsPage);