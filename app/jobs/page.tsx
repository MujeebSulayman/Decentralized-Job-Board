"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getIPFSGatewayUrl } from "@/utils/ipfsUpload";
import Header from "@/components/Header";
import { getAllJobs } from "@/services/blockchain";
import { JobStruct, WorkMode, JobType } from "@/utils/type.dt";
import { toast } from "react-toastify";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";

// We'll use the JobStruct interface from type.dt.ts

const JobsPage = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobStruct[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobStruct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    location: "all",
    type: "all",
    salary: "all",
  });

  // Fetch jobs from blockchain
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        const fetchedJobs = await getAllJobs();
        // Filter only active jobs (not expired and not deleted)
        const activeJobs = fetchedJobs.filter(
          (job) => !job.expired && !job.deleted
        );
        setJobs(activeJobs);
        setFilteredJobs(activeJobs);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast.error("Failed to load jobs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setFilters({ ...filters, search: searchTerm });

    if (!searchTerm.trim()) {
      // If search is empty, reset to all jobs
      setFilteredJobs(jobs);
      return;
    }

    // Filter jobs based on search term
    const term = searchTerm.toLowerCase();
    const filtered = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(term) ||
        job.orgName.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term)
    );

    setFilteredJobs(filtered);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: "",
      location: "all",
      type: "all",
      salary: "all",
    });
    setFilteredJobs(jobs);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-24">
        {/* Search and Filter Section */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={filters.search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 flex items-center gap-2"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                Filters
              </button>
              {(filters.search ||
                filters.location !== "all" ||
                filters.type !== "all" ||
                filters.salary !== "all") && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-3 bg-red-900/30 backdrop-blur-sm rounded-xl border border-red-700/50 flex items-center gap-2 hover:bg-red-900/50 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => {
                    const newLocation = e.target.value;
                    setFilters({ ...filters, location: newLocation });

                    // Apply filter immediately
                    let filtered = [...jobs];

                    // Keep search filter if it exists
                    if (filters.search) {
                      const term = filters.search.toLowerCase();
                      filtered = filtered.filter(
                        (job) =>
                          job.title.toLowerCase().includes(term) ||
                          job.orgName.toLowerCase().includes(term) ||
                          job.description.toLowerCase().includes(term)
                      );
                    }

                    // Apply new location filter
                    if (newLocation !== "all") {
                      const locationValue = {
                        remote: 0,
                        onsite: 1,
                        hybrid: 2,
                      }[newLocation];

                      filtered = filtered.filter(
                        (job) => Number(job.workMode) === locationValue
                      );
                    }

                    // Keep type filter if it exists
                    if (filters.type !== "all") {
                      const typeValue = {
                        "full-time": 0,
                        "part-time": 1,
                        internship: 2,
                        freelance: 3,
                        contract: 4,
                      }[filters.type];

                      filtered = filtered.filter(
                        (job) => Number(job.jobType) === typeValue
                      );
                    }

                    // Keep salary filter if it exists
                    if (filters.salary !== "all") {
                      const getSalaryRange = (salaryFilter: string) => {
                        switch (salaryFilter) {
                          case "0-50k":
                            return { min: 0, max: 50000 };
                          case "50k-100k":
                            return { min: 50000, max: 100000 };
                          case "100k+":
                            return { min: 100000, max: Infinity };
                          default:
                            return { min: 0, max: Infinity };
                        }
                      };

                      const range = getSalaryRange(filters.salary);
                      filtered = filtered.filter((job) => {
                        const minSalary = Number(job.minimumSalary || "0");
                        return minSalary >= range.min && minSalary < range.max;
                      });
                    }

                    setFilteredJobs(filtered);
                  }}
                  className="w-full px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                  <option value="all">All Locations</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Job Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFilters({ ...filters, type: newType });

                    // Apply filter immediately
                    let filtered = [...jobs];

                    // Keep search filter if it exists
                    if (filters.search) {
                      const term = filters.search.toLowerCase();
                      filtered = filtered.filter(
                        (job) =>
                          job.title.toLowerCase().includes(term) ||
                          job.orgName.toLowerCase().includes(term) ||
                          job.description.toLowerCase().includes(term)
                      );
                    }

                    // Keep location filter if it exists
                    if (filters.location !== "all") {
                      const locationValue = {
                        remote: 0, // Remote
                        onsite: 1, // Onsite
                        hybrid: 2, // Hybrid
                      }[filters.location];

                      filtered = filtered.filter(
                        (job) => Number(job.workMode) === locationValue
                      );
                    }

                    // Apply new type filter
                    if (newType !== "all") {
                      const typeValue = {
                        "full-time": 0, // FullTime
                        "part-time": 1, // PartTime
                        internship: 2, // Internship
                        freelance: 3, // Freelance
                        contract: 4, // Contract
                      }[newType];

                      filtered = filtered.filter(
                        (job) => Number(job.jobType) === typeValue
                      );
                    }

                    // Keep salary filter if it exists
                    if (filters.salary !== "all") {
                      const getSalaryRange = (salaryFilter: string) => {
                        switch (salaryFilter) {
                          case "0-50k":
                            return { min: 0, max: 50000 };
                          case "50k-100k":
                            return { min: 50000, max: 100000 };
                          case "100k+":
                            return { min: 100000, max: Infinity };
                          default:
                            return { min: 0, max: Infinity };
                        }
                      };

                      const range = getSalaryRange(filters.salary);
                      filtered = filtered.filter((job) => {
                        const minSalary = Number(job.minimumSalary || "0");
                        return minSalary >= range.min && minSalary < range.max;
                      });
                    }

                    setFilteredJobs(filtered);
                  }}
                  className="w-full px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Salary Range</label>
                <select
                  value={filters.salary}
                  onChange={(e) => {
                    const newSalary = e.target.value;
                    setFilters({ ...filters, salary: newSalary });

                    // Apply filter immediately
                    let filtered = [...jobs];

                    // Keep search filter if it exists
                    if (filters.search) {
                      const term = filters.search.toLowerCase();
                      filtered = filtered.filter(
                        (job) =>
                          job.title.toLowerCase().includes(term) ||
                          job.orgName.toLowerCase().includes(term) ||
                          job.description.toLowerCase().includes(term)
                      );
                    }

                    // Keep location filter if it exists
                    if (filters.location !== "all") {
                      const locationValue = {
                        remote: 0,
                        onsite: 1,
                        hybrid: 2,
                      }[filters.location];

                      filtered = filtered.filter(
                        (job) => Number(job.workMode) === locationValue
                      );
                    }

                    if (filters.type !== "all") {
                      const typeValue = {
                        "full-time": 0,
                        "part-time": 1,
                        internship: 2,
                        freelance: 3,
                        contract: 4,
                      }[filters.type];

                      filtered = filtered.filter(
                        (job) => Number(job.jobType) === typeValue
                      );
                    }

                    // Apply new salary filter
                    if (newSalary !== "all") {
                      const getSalaryRange = (salaryFilter: string) => {
                        switch (salaryFilter) {
                          case "0-50k":
                            return { min: 0, max: 50000 };
                          case "50k-100k":
                            return { min: 50000, max: 100000 };
                          case "100k+":
                            return { min: 100000, max: Infinity };
                          default:
                            return { min: 0, max: Infinity };
                        }
                      };

                      const range = getSalaryRange(newSalary);
                      filtered = filtered.filter((job) => {
                        const minSalary = Number(job.minimumSalary || "0");
                        return minSalary >= range.min && minSalary < range.max;
                      });
                    }

                    setFilteredJobs(filtered);
                  }}
                  className="w-full px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                  <option value="all">All Ranges</option>
                  <option value="0-50k">$0 - $50k</option>
                  <option value="50k-100k">$50k - $100k</option>
                  <option value="100k+">$100k+</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-400">No jobs found</h2>
            <p className="text-gray-500 mt-2">
              Try adjusting your search filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => router.push(`/jobs/${job.id.toString()}`)}
                className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  <div className="relative h-12 w-12">
                    {job.logoCID ? (
                      <Image
                        src={getIPFSGatewayUrl(job.logoCID)}
                        alt={job.orgName}
                        fill
                        className="rounded-lg object-cover"
                        sizes="(max-width: 48px) 100vw, 48px"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <BriefcaseIcon className="h-6 w-6 text-purple-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-white truncate">
                      {job.title}
                    </h2>
                    <p className="text-purple-400">{job.orgName}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-gray-400">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    <span>
                      {Number(job.workMode) === 0
                        ? "Remote"
                        : Number(job.workMode) === 1
                        ? "On-site"
                        : "Hybrid"}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                    <span>
                      {job.minimumSalary && job.maximumSalary
                        ? `$${Number(
                            job.minimumSalary
                          ).toLocaleString()} - $${Number(
                            job.maximumSalary
                          ).toLocaleString()}`
                        : job.minimumSalary
                        ? `From $${Number(job.minimumSalary).toLocaleString()}`
                        : "Competitive"}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <BriefcaseIcon className="h-5 w-5 mr-2" />
                    <span>
                      {Number(job.jobType) === 0
                        ? "Full-time"
                        : Number(job.jobType) === 1
                        ? "Part-time"
                        : Number(job.jobType) === 2
                        ? "Internship"
                        : Number(job.jobType) === 3
                        ? "Freelance"
                        : "Contract"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Posted{" "}
                    {new Date(
                      Number(job.startTime) * 1000
                    ).toLocaleDateString()}
                  </span>
                  <span className="px-3 py-1 text-sm rounded-full bg-purple-500/20 text-purple-400">
                    {new Date(Number(job.expirationTime) * 1000) > new Date()
                      ? "Active"
                      : "Expired"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
