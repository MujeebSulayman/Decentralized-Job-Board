"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Header from '@/components/Header';
import { getJobApplications, getAllJobs } from '@/services/blockchain';
import { ApplicationStruct, ApplicationState, JobStruct } from '@/utils/type.dt';
import { formatDistanceToNow } from 'date-fns';
import { useAccount } from 'wagmi';

const ApplicationsPage = () => {
  const router = useRouter();
  const { address } = useAccount();
  const [applications, setApplications] = useState<ApplicationStruct[]>([]);
  const [jobs, setJobs] = useState<Record<number, JobStruct>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      fetchApplications();
    }
  }, [address]);

  const fetchApplications = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      
      // Get all jobs first
      const allJobs = await getAllJobs();
      const jobsMap: Record<number, JobStruct> = {};
      
      for (const job of allJobs) {
        jobsMap[job.id] = job;
      }
      
      setJobs(jobsMap);
      
      // Get applications for each job where the user is an applicant
      const applicationsPromises = allJobs.map(job => getJobApplications(job.id));
      const allApplicationsArrays = await Promise.all(applicationsPromises);
      
      // Flatten and filter applications for the current user
      const myApplications = allApplicationsArrays
        .flat()
        .filter(app => app.applicant.toLowerCase() === address.toLowerCase());
      
      setApplications(myApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  // We no longer show application status to applicants for privacy reasons

  return (
    <div className="min-h-screen pt-8 bg-black text-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-purple-500/20">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-purple-900/50 to-purple-800/30 border-b border-purple-500/20">
            <h1 className="text-2xl font-bold text-white">My Applications</h1>
            <p className="mt-1 text-purple-200">Track your job applications</p>
          </div>
          
          {/* Information box */}
          <div className="px-8 py-6 bg-blue-900/20 border-b border-blue-500/20">
            <h2 className="text-lg font-medium text-blue-400 mb-2">What happens after you apply?</h2>
            <p className="text-sm text-gray-300 mb-2">
              After submitting your application, employers will review your qualifications and experience. This process typically takes 1-2 weeks.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 ml-2">
              <li>You'll receive email notifications about your application status</li>
              <li>Shortlisted candidates will be contacted for interviews</li>
              <li>Keep checking this page for the latest updates on your applications</li>
            </ul>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-400 mb-4">You haven't applied to any jobs yet</div>
                <button
                  onClick={() => router.push('/jobs')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Next Steps
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {applications.map((application) => {
                      const job = jobs[application.jobId];
                      return (
                        <tr key={`${application.jobId}-${application.applicant}`} className="hover:bg-gray-800/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{job?.title || 'Unknown Job'}</div>
                            <div className="text-xs text-gray-400">{application.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{job?.orgName || 'Unknown Company'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">
                              {formatDistanceToNow(new Date(Number(application.applicationTimestamp) * 1000), {
                                addSuffix: true,
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <div className="text-sm text-blue-400 font-medium">
                                Check email for updates
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(Number(application.applicationTimestamp) * 1000) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
                                  ? "Application under review" 
                                  : "Interview decisions in progress"}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationsPage;
