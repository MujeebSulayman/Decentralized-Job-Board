'use client'

import React, { useState } from 'react';
import withAdminLayout from '@/components/hoc/withAdminLayout';
import { 
  BriefcaseIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  MapPinIcon, 
  DocumentPlusIcon 
} from "@heroicons/react/24/solid";

const jobCategories = [
  'Software Development',
  'Design & Creative',
  'Writing & Translation',
  'Sales & Marketing',
  'Customer Service',
  'Finance & Accounting',
  'Legal',
  'Engineering',
  'Other'
];

const jobTypes = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship'
];

const CreateJobPage: React.FC = () => {
  const [jobDetails, setJobDetails] = useState({
    title: '',
    category: '',
    type: '',
    description: '',
    skills: '',
    budget: '',
    location: '',
    duration: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setJobDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement job posting logic
    console.log('Job Details:', jobDetails);
  };

  return (
    <div className="space-y-6 p-6 bg-black/90 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Create a New Job
        </h1>
        <DocumentPlusIcon className="h-10 w-10 text-green-500" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Basics */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <BriefcaseIcon className="h-6 w-6 mr-3 text-blue-500" />
            Job Basics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Job Title</label>
              <input
                type="text"
                name="title"
                value={jobDetails.title}
                onChange={handleInputChange}
                placeholder="e.g. Senior Software Engineer"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Job Category</label>
              <select
                name="category"
                value={jobDetails.category}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Category</option>
                {jobCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ClockIcon className="h-6 w-6 mr-3 text-yellow-500" />
            Job Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Job Type</label>
              <select
                name="type"
                value={jobDetails.type}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Job Type</option>
                {jobTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-red-500" />
                <input
                  type="text"
                  name="location"
                  value={jobDetails.location}
                  onChange={handleInputChange}
                  placeholder="City, Country"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">Job Description</label>
            <textarea
              name="description"
              value={jobDetails.description}
              onChange={handleInputChange}
              placeholder="Detailed job description..."
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
        </div>

        {/* Compensation */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 mr-3 text-green-500" />
            Compensation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Budget/Salary</label>
              <div className="flex items-center">
                <span className="mr-2 text-gray-400">$</span>
                <input
                  type="number"
                  name="budget"
                  value={jobDetails.budget}
                  onChange={handleInputChange}
                  placeholder="Enter budget or salary"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Project Duration</label>
              <input
                type="text"
                name="duration"
                value={jobDetails.duration}
                onChange={handleInputChange}
                placeholder="e.g. 3 months, Full-time"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">Required Skills</label>
            <input
              type="text"
              name="skills"
              value={jobDetails.skills}
              onChange={handleInputChange}
              placeholder="Enter skills separated by commas"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-right">
          <button
            type="submit"
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Create Job
          </button>
        </div>
      </form>
    </div>
  );
};

export default withAdminLayout(CreateJobPage);
