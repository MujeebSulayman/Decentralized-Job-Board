'use client';

import React, { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import Image from 'next/image';

import { getIPFSGatewayUrl } from '@/utils/ipfsUpload';

import { getAllJobs } from '@/services/blockchain';

import { JobStruct, WorkMode } from '@/utils/type.dt';

import {
	MapPinIcon,
	CurrencyDollarIcon,
	BriefcaseIcon,
	ClockIcon,
	BuildingOfficeIcon,
	ChevronRightIcon,
	MagnifyingGlassIcon,
	AdjustmentsHorizontalIcon,
	ChevronDownIcon,
} from '@heroicons/react/24/outline';

const JobBoard = () => {
	const router = useRouter();

	const [jobs, setJobs] = useState<JobStruct[]>([]);

	const [filteredJobs, setFilteredJobs] = useState<JobStruct[]>([]);

	const [isLoading, setIsLoading] = useState(true);

	const [activeFilter, setActiveFilter] = useState('all jobs');

	const [activeLocation, setActiveLocation] = useState('all locations');

	const [searchQuery, setSearchQuery] = useState('');

	const [sortBy, setSortBy] = useState('newest');
	const [location, setLocation] = useState('');

	useEffect(() => {
		const fetchJobs = async () => {
			try {
				const fetchedJobs = await getAllJobs();

				setJobs(fetchedJobs);

				setFilteredJobs(fetchedJobs);
			} catch (error) {
				console.error('Error fetching jobs:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchJobs();
	}, []);

	useEffect(() => {
		filterJobs();
	}, [activeFilter, activeLocation, searchQuery, location, sortBy]);

	const filterJobs = () => {
		let filtered = [...jobs];

		// Category filter
		if (activeFilter !== 'all jobs') {
			filtered = filtered.filter(
				(job) =>
					job.title.toLowerCase().includes(activeFilter) ||
					job.description.toLowerCase().includes(activeFilter)
			);
		}

		// Work mode filter
		if (activeLocation !== 'all locations') {
			filtered = filtered.filter(
				(job) =>
					job.workMode === WorkMode[activeLocation as keyof typeof WorkMode]
			);
		}

		// Search query
		if (searchQuery.trim()) {
			const searchTerm = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(
				(job) =>
					job.title.toLowerCase().includes(searchTerm) ||
					job.description.toLowerCase().includes(searchTerm)
			);
		}

		// Location search
		if (location.trim()) {
			const locationTerm = location.toLowerCase().trim();
			filtered = filtered.filter(
				(job) =>
					WorkMode[job.workMode].toLowerCase().includes(locationTerm) ||
					job.description.toLowerCase().includes(locationTerm)
			);
		}

		// Company filter from URL
		const urlParams = new URLSearchParams(window.location.search);
		const companyFilter = urlParams.get('company');
		if (companyFilter) {
			filtered = filtered.filter((job) => job.employer === companyFilter);
		}

		// Sort results
		filtered.sort((a, b) => {
			switch (sortBy) {
				case 'newest':
					return Number(b.startTime) - Number(a.startTime);
				case 'oldest':
					return Number(a.startTime) - Number(b.startTime);
				case 'salary-high':
					return Number(b.maximumSalary) - Number(a.maximumSalary);
				case 'salary-low':
					return Number(a.minimumSalary) - Number(b.minimumSalary);
				default:
					return 0;
			}
		});

		setFilteredJobs(filtered);
	};

	const handleCategoryFilter = (filter: string) => {
		setActiveFilter(filter);
	};


	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	const jobCategories = [
		'All Jobs',
		'For You',
		'Remote',
		'Entry Level',
		'Internship',

		// Technical Roles
		'Developer',
		'Frontend',
		'Backend',
		'Full Stack',
		'Blockchain',
		'Smart Contract',
		'Solidity',
		'Rust',
		'DevOps',
		'Engineer',
		'InfoSec',

		// Blockchain Specific
		'Web3',
		'DeFi',
		'NFT',
		'Zero Knowledge',
		'Ethereum',
		'Solana',

		// Non-Technical Roles
		'Design',
		'Marketing',
		'Community',
		'Product',
		'Management & Finance',
		'Compliance',
		// Other
		'Trading',
		'Crypto',
	];

	const workModes = ['All Locations', 'Remote', 'Hybrid', 'Onsite'];

	return (
		<section className='max-w-6xl mx-auto px-4 py-12'>
			{/* Category Filters */}
			<div className='mb-8 space-y-4'>
				<div className='flex flex-wrap gap-2'>
					{jobCategories.map((filter) => (
						<button
							key={filter}
							onClick={() => handleCategoryFilter(filter.toLowerCase())}
							className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
								activeFilter === filter.toLowerCase()
									? 'bg-purple-500 text-white'
									: 'bg-gray-800/40 text-gray-300 hover:bg-gray-700/40'
							}`}>
							{filter}
						</button>
					))}
				</div>

				{/* Search Bar Section */}
				<div className='grid grid-cols-1 md:grid-cols-12 gap-4 mt-6'>
					{/* Search Input */}
					<div className='md:col-span-5 relative'>
						<MagnifyingGlassIcon className='h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
						<input
							type='text'
							value={searchQuery}
							onChange={handleSearchChange}
							placeholder='Search job titles or keywords...'
							className='w-full pl-10 pr-4 py-3 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white'
						/>
					</div>

					{/* Location Input */}
					<div className='md:col-span-4 relative'>
						<MapPinIcon className='h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
						<input
							type='text'
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							placeholder='Location or remote...'
							className='w-full pl-10 pr-4 py-3 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white'
						/>
					</div>

					{/* Sort Dropdown */}
					<div className='md:col-span-3'>
						<div className='relative'>
							<select
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								className='w-full px-4 py-3 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-white appearance-none'>
								<option value='newest'>Newest First</option>
								<option value='oldest'>Oldest First</option>
								<option value='salary-high'>Highest Salary</option>
								<option value='salary-low'>Lowest Salary</option>
							</select>
							<ChevronDownIcon className='h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none' />
						</div>
					</div>
				</div>
			</div>

			{/* Job Listings */}

			{isLoading ? (
				<div className='flex justify-center items-center h-64'>
					<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500'></div>
				</div>
			) : filteredJobs.length === 0 ? (
				<div className='text-center py-12'>
					<h3 className='text-2xl font-bold text-gray-400'>No jobs found</h3>

					<p className='text-gray-500 mt-2'>Try adjusting your filters</p>
				</div>
			) : (
				<div className='space-y-4 pb-24'>
					{filteredJobs.map((job) => (
						<div
							key={job.id}
							onClick={() => router.push(`/jobs/${job.id}`)}
							className='group bg-gray-800/40 hover:bg-gray-800/60 backdrop-blur-sm rounded-lg p-6 transition-all duration-200 cursor-pointer border border-gray-700/50 hover:border-purple-500/50'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center space-x-4 flex-1 min-w-0'>
									<div className='relative h-12 w-12 flex-shrink-0'>
										{job.logoCID ? (
											<Image
												src={getIPFSGatewayUrl(job.logoCID)}
												alt={job.orgName}
												fill
												className='rounded-lg object-cover'
												sizes='48px'
											/>
										) : (
											<div className='h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center'>
												<BuildingOfficeIcon className='h-6 w-6 text-purple-400' />
											</div>
										)}
									</div>

									<div className='flex-1 min-w-0'>
										<div className='flex items-center justify-between'>
											<h3 className='text-lg font-medium text-white truncate group-hover:text-purple-400 transition-colors'>
												{job.title}
											</h3>

											<ChevronRightIcon className='h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors ml-4 flex-shrink-0' />
										</div>

										<div className='mt-1 flex items-center space-x-4'>
											<span className='text-purple-400 truncate'>
												{job.orgName}
											</span>

											<span className='text-gray-500'>•</span>

											<span className='text-gray-400 truncate'>
												{job.workMode}
											</span>

											<span className='text-gray-500'>•</span>

											<span className='text-gray-400'>
												${job.minimumSalary} - ${job.maximumSalary}
											</span>
										</div>
									</div>
								</div>

								<div className='flex items-center space-x-4 ml-4 flex-shrink-0'>
									<div className='flex flex-col items-end'>
										<span className='text-sm text-gray-400'>
											{new Date(
												Number(job.startTime) * 1000
											).toLocaleDateString()}
										</span>

										<span
											className={`mt-1 px-3 py-1 text-xs rounded-full ${
												Number(job.isOpen)
													? 'bg-green-500/10 text-green-400'
													: 'bg-red-500/10 text-red-400'
											}`}>
											{Number(job.isOpen) ? 'Active' : 'Closed'}
										</span>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	);
};

export default JobBoard;
