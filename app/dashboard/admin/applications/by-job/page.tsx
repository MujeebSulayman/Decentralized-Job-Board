"use client";

import withAdminLayout from "@/components/hoc/withAdminLayout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BriefcaseIcon, ClipboardDocumentCheckIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

function JobApplicationsRedirectPage() {
    const router = useRouter();

    // Optionally auto-redirect after a delay
    // useEffect(() => {
    //   const timer = setTimeout(() => {
    //     router.push("/dashboard/admin/jobs");
    //   }, 3000);
    //   return () => clearTimeout(timer);
    // }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700/50 max-w-2xl w-full text-center">
                <div className="mb-6">
                    <div className="bg-blue-900/20 h-24 w-24 rounded-full flex items-center justify-center mx-auto">
                        <ClipboardDocumentCheckIcon className="h-12 w-12 text-blue-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-4">Job Applications</h1>
                <p className="text-gray-300 mb-8">
                    Please select a job from the jobs list to view its applications.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={() => router.push("/dashboard/admin/jobs")}
                        className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
                    >
                        <BriefcaseIcon className="h-5 w-5" />
                        Go to Jobs List
                        <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </button>

                    <button
                        onClick={() => router.push("/dashboard/admin/applications")}
                        className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                    >
                        <ClipboardDocumentCheckIcon className="h-5 w-5" />
                        View All Applications
                    </button>
                </div>
            </div>
        </div>
    );
}

export default withAdminLayout(JobApplicationsRedirectPage); 