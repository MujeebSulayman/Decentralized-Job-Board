"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getJobApplicants, getJob } from "@/services/blockchain";
import { ApplicationStruct, JobStruct } from "@/utils/type.dt";
import JobApplicationCard from "@/app/components/JobApplicationCard";

export default function JobApplicationsPage() {
  const { jobId } = useParams();
  const [applications, setApplications] = useState<ApplicationStruct[]>([]);
  const [job, setJob] = useState<JobStruct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (jobId) {
          const jobIdNumber = Number(jobId);
          const [jobData, applicantsData] = await Promise.all([
            getJob(jobIdNumber),
            getJobApplicants(jobIdNumber)
          ]);
          setJob(jobData);
          setApplications(applicantsData);
        }
      } catch (error) {
        console.error("Error fetching job applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Job not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
        <p className="text-gray-400 mb-4">{job.orgName}</p>
        <div className="flex items-center space-x-4 mb-6">
          <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
            {job.workMode === 0 ? "Remote" : job.workMode === 1 ? "Onsite" : "Hybrid"}
          </span>
          <span className="px-3 py-1 bg-gray-800 rounded-full text-sm">
            {job.jobType === 0 ? "Full Time" : 
             job.jobType === 1 ? "Part Time" : 
             job.jobType === 2 ? "Internship" : 
             job.jobType === 3 ? "Freelance" : "Contract"}
          </span>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-6">Applications ({applications.length})</h2>

      {applications.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-xl">No applications yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((application, index) => (
            <JobApplicationCard key={index} application={application} jobId={Number(jobId)} />
          ))}
        </div>
      )}
    </div>
  );
}