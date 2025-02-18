"use client";

import React, { useState } from 'react';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { Cog6ToothIcon, ShieldCheckIcon, BellIcon } from '@heroicons/react/24/solid';

const SettingsPage = () => {
    const [settings, setSettings] = useState({
        requireVerification: true,
        autoApproveJobs: false,
        maxJobDuration: 30,
        notificationsEnabled: true,
        maintenanceMode: false
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">System Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Security Settings */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <div className="flex items-center mb-4">
                        <ShieldCheckIcon className="h-6 w-6 text-green-400 mr-2" />
                        <h2 className="text-lg font-semibold text-white">Security</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-gray-300">Require User Verification</label>
                                <p className="text-sm text-gray-500">Users must be verified before posting jobs</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.requireVerification}
                                    onChange={(e) => setSettings({ ...settings, requireVerification: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-gray-300">Auto-Approve Jobs</label>
                                <p className="text-sm text-gray-500">Automatically approve job postings</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.autoApproveJobs}
                                    onChange={(e) => setSettings({ ...settings, autoApproveJobs: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* System Settings */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <div className="flex items-center mb-4">
                        <Cog6ToothIcon className="h-6 w-6 text-blue-400 mr-2" />
                        <h2 className="text-lg font-semibold text-white">System</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-300">Maximum Job Duration (days)</label>
                            <input
                                type="number"
                                value={settings.maxJobDuration}
                                onChange={(e) => setSettings({ ...settings, maxJobDuration: parseInt(e.target.value) })}
                                className="w-full mt-1 px-4 py-2 bg-black/20 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-gray-300">Maintenance Mode</label>
                                <p className="text-sm text-gray-500">Temporarily disable the platform</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode}
                                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <div className="flex items-center mb-4">
                        <BellIcon className="h-6 w-6 text-yellow-400 mr-2" />
                        <h2 className="text-lg font-semibold text-white">Notifications</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-gray-300">System Notifications</label>
                                <p className="text-sm text-gray-500">Enable system-wide notifications</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.notificationsEnabled}
                                    onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withAdminLayout(SettingsPage); 