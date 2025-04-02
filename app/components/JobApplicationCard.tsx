"use client";

import { useState } from "react";
import { ApplicationState, ApplicationStruct } from "@/utils/type.dt";
import { updateApplicationStatus } from "@/services/blockchain";
import { toast } from "sonner";

interface JobApplicationCardProps {
  application: ApplicationStruct;
  jobId: number;
}

export default function JobApplicationCard({ application, jobId }: JobApplicationCardProps) {
  const [status, setStatus] = useState<ApplicationState>(application.currentState);
  const [loading, setLoading] = useState(false);

  const getStatusLabel = (state: ApplicationState) => {
    switch (state) {
      case ApplicationState.PENDING:
        return { text: "Pending", color: "bg-yellow-500/20 text-yellow-500" };
      case ApplicationState.SHORTLISTED:
        return { text: "Shortlisted", color: "bg-blue-500/20 text-blue-500" };
      case ApplicationState.REJECTED:
        return { text: "Rejected", color: "bg-red-500/20 text-red-500" };
      case ApplicationState.HIRED:
        return { text: "Hired", color: "bg-green-500/20 text-green-500" };
      default:
        return { text: "Unknown", color: "bg-gray-500/20 text-gray-500" };
    }
  };

  const handleStatusChange = async (newStatus: ApplicationState) => {
    try {
      setLoading(true);
      await updateApplicationStatus(jobId, application.applicant, newStatus);
      setStatus(newStatus);
      toast.success("Application status updated successfully");
    } catch (error) {
      console.error("Error updating application status:", error);
      toast.error("Failed to update application status");
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = getStatusLabel(status);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-green-500/50 transition-all duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">{application.name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-center text-gray-400">
            <span className="text-sm">📧 {application.email}</span>
          </div>
          <div className="flex items-center text-gray-400">
            <span className="text-sm">📱 {application.phoneNumber}</span>
          </div>
          <div className="flex items-center text-gray-400">
            <span className="text-sm">📍 {application.location}</span>
          </div>
          {application.github && (
            <div className="flex items-center text-gray-400">
              <span className="text-sm">GitHub: {application.github}</span>
            </div>
          )}
          {application.portfolioLink && (
            <div className="flex items-center text-gray-400">
              <span className="text-sm">Portfolio: {application.portfolioLink}</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Experience</h4>
          <p className="text-sm line-clamp-3">{application.experience}</p>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Expected Salary</h4>
          <p className="text-sm">{application.expectedSalary}</p>
        </div>

        {application.cvCID && (
          <div className="mt-4">
            <a
              href={`https://gateway.pinata.cloud/ipfs/${application.cvCID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-400 text-sm inline-flex items-center"
            >
              View Resume
            </a>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={() => handleStatusChange(ApplicationState.SHORTLISTED)}
            disabled={loading || status === ApplicationState.SHORTLISTED}
            className={`px-3 py-2 rounded text-xs font-medium ${status === ApplicationState.SHORTLISTED ? 'bg-blue-500/20 text-blue-500' : 'bg-blue-500 text-white hover:bg-blue-600'} transition-colors disabled:opacity-50`}
          >
            Shortlist
          </button>
          <button
            onClick={() => handleStatusChange(ApplicationState.HIRED)}
            disabled={loading || status === ApplicationState.HIRED}
            className={`px-3 py-2 rounded text-xs font-medium ${status === ApplicationState.HIRED ? 'bg-green-500/20 text-green-500' : 'bg-green-500 text-white hover:bg-green-600'} transition-colors disabled:opacity-50`}
          >
            Hire
          </button>
          <button
            onClick={() => handleStatusChange(ApplicationState.REJECTED)}
            disabled={loading || status === ApplicationState.REJECTED}
            className={`px-3 py-2 rounded text-xs font-medium ${status === ApplicationState.REJECTED ? 'bg-red-500/20 text-red-500' : 'bg-red-500 text-white hover:bg-red-600'} transition-colors disabled:opacity-50 col-span-2`}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
