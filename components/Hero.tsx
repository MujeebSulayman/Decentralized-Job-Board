import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const Hero = () => {
  return (
    <main className="relative w-full min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-gray-900 opacity-90 pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center space-y-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            delay: 0.2, 
            duration: 0.6, 
            type: "spring", 
            stiffness: 200, 
            damping: 10 
          }}
          className="inline-flex items-center px-5 py-2 rounded-full bg-gray-800/50 backdrop-blur-md border border-gray-700/50 hover:bg-gray-700/50 transition-all duration-300"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-3"></span>
          <span className="text-gray-300 text-sm font-medium tracking-wide">
            Blockchain-Powered Job Marketplace
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.3, 
            duration: 0.7, 
            type: "spring", 
            stiffness: 100, 
            damping: 15 
          }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight"
        >
           Web3 Jobs -{" "}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 animate-gradient-x">
          Blockchain, Crypto Careers
          </span>
        </motion.h1>

     
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.4, 
            duration: 0.7, 
            type: "spring", 
            stiffness: 100, 
            damping: 15 
          }}
          className="text-lg text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed tracking-wide"
        >
          Secure job listings with blockchain verification. 
          Post, apply, and manage jobs through smart contracts. 
          Transparent hiring with zero intermediaries.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.5, 
            duration: 0.7, 
            type: "spring", 
            stiffness: 100, 
            damping: 15 
          }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/jobs" className="w-full sm:w-auto group">
            <button className="w-full sm:w-auto px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 shadow-xl hover:shadow-green-500/50 group-hover:ring-2 group-hover:ring-green-500/50">
              <span className="flex items-center justify-center">
                Find job
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </Link>
     
          <Link href="/post-job" className="w-full sm:w-auto group">
            <button className="w-full sm:w-auto px-8 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 shadow-xl hover:shadow-gray-500/50 group-hover:ring-2 group-hover:ring-gray-500/50">
              <span className="flex items-center justify-center">
                Post a Job
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:rotate-45 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </span>
            </button>
          </Link>
        </motion.div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-green-900/10 to-blue-900/10 blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-green-900/10 to-blue-900/10 blur-3xl opacity-30 animate-pulse"></div>
      </div>
    </main>
  );
};

export default Hero;
