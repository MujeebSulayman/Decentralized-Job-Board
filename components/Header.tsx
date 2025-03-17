import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CgMenuLeft } from 'react-icons/cg';
import { FaTimes } from 'react-icons/fa';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NavLink = ({
	href,
	children,
	mobile = false,
}: {
	href: string;
	children: React.ReactNode;
	mobile?: boolean;
}) => {
	const linkClasses = mobile
		? 'block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-300'
		: 'text-gray-300 hover:text-white transition-all duration-300 relative group';

	const desktopLinkContent = (
		<span className='relative'>
			{children}
			<span className='absolute bottom-0 left-0 w-0 h-0.5 bg-green-500 transition-all duration-300 group-hover:w-full'></span>
		</span>
	);

	return (
		<Link
			href={href}
			className={linkClasses}>
			{mobile ? children : desktopLinkContent}
		</Link>
	);
};

const Header: React.FC = () => {
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [scrolled, setScrolled] = useState<boolean>(false);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 10);
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<motion.header
			className={`fixed z-50 top-0 right-0 left-0 transition-all duration-300 ${
				scrolled
					? 'bg-black/80 backdrop-blur-xl border-b border-gray-800'
					: 'bg-transparent'
			}`}
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			transition={{
				duration: 0.5,
				type: 'spring',
				stiffness: 200,
				damping: 20,
			}}>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex justify-between items-center py-4 md:justify-start md:space-x-10'>
					{/* Logo */}
					<div className='flex justify-start lg:w-0 lg:flex-1'>
						<Link
							href={'/'}
							className='text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 tracking-tight'>
							<motion.span
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.5, type: 'spring' }}>
								HemBoard
							</motion.span>
						</Link>
					</div>

					{/* Mobile Menu Button */}
					<div className='-mr-2 -my-2 md:hidden'>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setIsOpen(!isOpen)}
							className='bg-gray-800 rounded-md p-2 inline-flex items-center justify-center text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500'>
							<span className='sr-only'>Open menu</span>
							<CgMenuLeft
								className='h-6 w-6'
								aria-hidden='true'
							/>
						</motion.button>
					</div>

					<nav className='hidden md:flex space-x-10 font-medium text-web3-base'>
						<NavLink href='/jobs'>Verified Jobs</NavLink>
						<NavLink href='/post-job'>Create Listing</NavLink>
						<NavLink href='/applications'>Job Applications</NavLink>
						<NavLink href='/dashboard/admin'>Admin Dashboard</NavLink>
						<NavLink href='/dashboard/employer'>Employer Dashboard</NavLink>
					</nav>

					<div className='hidden md:flex items-center justify-end md:flex-1 lg:w-0'>
						<ConnectButton
							showBalance={false}
							accountStatus={{
								smallScreen: 'avatar',
								largeScreen: 'full',
							}}
						/>
					</div>
				</div>
			</div>

			{/* Mobile Menu */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						className='absolute top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden'
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ duration: 0.2 }}>
						<div className='rounded-lg shadow-xl ring-1 ring-white/10 bg-black/90 backdrop-blur-xl divide-y divide-gray-800'>
							<div className='pt-5 pb-6 px-5'>
								<div className='flex items-center justify-between'>
									<Link
										href={'/'}
										className='text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500'>
										HemBoard
									</Link>
									<div className='-mr-2'>
										<motion.button
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											onClick={() => setIsOpen(false)}
											className='bg-gray-800 rounded-md p-2 inline-flex items-center justify-center text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500'>
											<span className='sr-only'>Close menu</span>
											<FaTimes
												className='h-6 w-6'
												aria-hidden='true'
											/>
										</motion.button>
									</div>
								</div>
								<div className='mt-6'>
									<nav className='grid gap-y-4'>
										<NavLink
											href='/jobs'
											mobile>
											Verified Jobs
										</NavLink>
										<NavLink
											href='/post-job'
											mobile>
											Create Listing
										</NavLink>
										<NavLink
											href='/applications'
											mobile>
											Job Applications
										</NavLink>
										<NavLink
											href='/dashboard'
											mobile>
											Admin Dashboard
										</NavLink>
										<NavLink
											href='/dashboard'
											mobile>
											Employer Dashboard
										</NavLink>
									</nav>
								</div>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.header>
	);
};

export default Header;
