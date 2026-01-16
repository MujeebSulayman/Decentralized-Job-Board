"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getPaymasterEnabled } from "@/services/blockchain";

const Hero = () => {
  const [paymasterEnabled, setPaymasterEnabled] = useState<boolean>(false);

  useEffect(() => {
    const fetchPaymasterStatus = async () => {
      try {
        const enabled = await getPaymasterEnabled();
        setPaymasterEnabled(enabled);
      } catch (error) {
        console.error("Error fetching paymaster status:", error);
      }
    };

    fetchPaymasterStatus();
  }, []);

  return (
    <main className="relative w-full min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden">
      <div className="absolute inset-0 bg-black"></div>
      
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-green-500/30"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="absolute inset-0 overflow-hidden">
        <motion.svg
          className="absolute inset-0 w-full h-full"
          style={{ overflow: "visible" }}
        >
          <motion.line
            x1="0"
            y1="0"
            x2="100%"
            y2="100%"
            stroke="url(#diagonalGradient1)"
            strokeWidth="1"
            strokeLinecap="round"
            animate={{
              x1: ["-50%", "150%"],
              y1: ["-50%", "150%"],
              x2: ["-50%", "150%"],
              y2: ["-50%", "150%"],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.line
            x1="100%"
            y1="0"
            x2="0"
            y2="100%"
            stroke="url(#diagonalGradient2)"
            strokeWidth="1"
            strokeLinecap="round"
            animate={{
              x1: ["150%", "-50%"],
              y1: ["-50%", "150%"],
              x2: ["150%", "-50%"],
              y2: ["-50%", "150%"],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.path
            d="M 0,50 Q 25,0 50,50 T 100,50"
            stroke="url(#curveGradient1)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            transform="scale(10)"
            animate={{
              d: [
                "M 0,50 Q 25,0 50,50 T 100,50",
                "M 0,50 Q 25,100 50,50 T 100,50",
                "M 0,50 Q 25,0 50,50 T 100,50",
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.path
            d="M 0,0 L 20,20 L 40,0 L 60,20 L 80,0 L 100,20"
            stroke="url(#zigzagGradient1)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            transform="scale(10) translate(0, 30)"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.path
            d="M 0,20 L 20,0 L 40,20 L 60,0 L 80,20 L 100,0"
            stroke="url(#zigzagGradient2)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            transform="scale(10) translate(0, 60)"
            animate={{
              x: ["200%", "-100%"],
            }}
            transition={{
              duration: 13,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="200"
            stroke="url(#circleGradient1)"
            strokeWidth="1"
            fill="none"
            animate={{
              r: [150, 250, 150],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="300"
            stroke="url(#circleGradient2)"
            strokeWidth="1"
            fill="none"
            animate={{
              r: [250, 350, 250],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.path
            d="M 0,0 L 50,50 L 100,0"
            stroke="url(#triangleGradient1)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            transform="scale(15) translate(0, 10)"
            animate={{
              x: ["-100%", "200%"],
              rotate: [0, 360],
            }}
            transition={{
              x: {
                duration: 14,
                repeat: Infinity,
                ease: "linear",
              },
              rotate: {
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          />
          <motion.path
            d="M 0,100 L 50,50 L 100,100"
            stroke="url(#triangleGradient2)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            transform="scale(15) translate(0, 20)"
            animate={{
              x: ["200%", "-100%"],
              rotate: [360, 0],
            }}
            transition={{
              x: {
                duration: 16,
                repeat: Infinity,
                ease: "linear",
              },
              rotate: {
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          />
          <defs>
            <linearGradient id="diagonalGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="diagonalGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="curveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="zigzagGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="zigzagGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="circleGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="circleGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="triangleGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.7" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="triangleGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </motion.svg>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      
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
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <div className="inline-flex items-center px-5 py-2 rounded-full bg-gray-900/80 backdrop-blur-md border border-gray-700/50 hover:bg-gray-800/80 transition-all duration-300">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-3"></span>
            <span className="text-gray-300 text-sm font-medium tracking-wide">
              Blockchain-Powered Job Marketplace
            </span>
          </div>
          {paymasterEnabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: 0.3, 
                duration: 0.5,
                type: "spring",
                stiffness: 200
              }}
              className="inline-flex items-center px-5 py-2 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/50 hover:bg-green-500/30 transition-all duration-300"
            >
              <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-green-400 text-sm font-semibold tracking-wide">
                Gasless Transactions
              </span>
            </motion.div>
          )}
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
          className="text-[17px] text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed tracking-wide"
        >
          Secure job listings with blockchain verification. 
          Post, apply, and manage jobs through smart contracts. 
          {paymasterEnabled ? (
            <>
              <span className="text-green-400 font-semibold"> Gasless transactions</span> - no gas fees required!
            </>
          ) : (
            " Transparent hiring with zero intermediaries."
          )}
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
            <button className="w-full sm:w-auto px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 shadow-md hover:shadow-green-500/50 group-hover:ring-2 group-hover:ring-green-500/50">
              <span className="flex items-center justify-center">
                Find job
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </Link>
     
          <Link href="/post" className="w-full sm:w-auto group">
            <button className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 shadow-md hover:shadow-blue-500/50 group-hover:ring-2 group-hover:ring-blue-500/50">
              <span className="flex items-center justify-center">
                Create Job
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:rotate-45 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </span>
            </button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
};

export default Hero;
