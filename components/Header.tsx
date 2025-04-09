import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMenuAlt4 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  mobile?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
  href,
  children,
  mobile = false,
  onClick,
  isActive = false,
}) => {
  const linkClasses = mobile
    ? `block py-3 px-4 text-base font-medium transition-all duration-300 ${
        isActive
          ? "text-white bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg"
          : "text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg"
      }`
    : `relative px-3 py-2 text-base font-medium transition-all duration-300 ${
        isActive ? "text-white" : "text-gray-300 hover:text-white"
      }`;

  const desktopLinkContent = (
    <span className="relative inline-block">
      {children}
      <span
        className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300 ${
          isActive ? "w-full" : "w-0 group-hover:w-full"
        }`}
      ></span>
    </span>
  );

  return (
    <Link href={href} className={linkClasses} onClick={onClick}>
      {mobile ? children : desktopLinkContent}
    </Link>
  );
};

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [pathname, setPathname] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Get current pathname for active link detection
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }
  }, []);

  // Handle scroll effect
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== "undefined") {
      const handleScroll = () => {
        setScrolled(window.scrollY > 20);
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(event.target as Node) &&
          isOpen
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    // Only run in browser environment
    if (typeof document !== "undefined") {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  return (
    <motion.header
      className={`fixed z-50 top-0 right-0 left-0 transition-all duration-300 ${
        scrolled
          ? " backdrop-blur-md shadow-lg shadow-black/10 border-b border-gray-800/30"
          : "backdrop-blur-md"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{
        duration: 0.5,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="group flex items-center"
              aria-label="HemBoard Home"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 tracking-tight group-hover:from-green-500 group-hover:to-blue-600 transition-all duration-300">
                  HemBoard
                </span>
              </motion.div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink href="/jobs" isActive={pathname === "/jobs"}>
              Verified Jobs
            </NavLink>
            <NavLink href="/post" isActive={pathname === "/post"}>
              Create Job
            </NavLink>
            <NavLink
              href="/applications"
              isActive={pathname === "/applications"}
            >
              Job Applications
            </NavLink>
            <NavLink
              href="/dashboard/admin"
              isActive={pathname === "/dashboard/admin"}
            >
              Admin Dashboard
            </NavLink>
            <NavLink
              href="/dashboard/employer"
              isActive={pathname === "/dashboard/employer"}
            >
              Employer Dashboard
            </NavLink>
          </nav>

          {/* Desktop Connect Button */}
          <div className="hidden md:flex items-center">
            <div className="ml-4 flex items-center">
              <div className="bg-gray-800/40 backdrop-blur-sm p-1.5 rounded-lg shadow-inner border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300">
                <ConnectButton
                  showBalance={false}
                  accountStatus={{
                    smallScreen: "avatar",
                    largeScreen: "full",
                  }}
                  chainStatus={{
                    smallScreen: "icon",
                    largeScreen: "full",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 transition-all duration-200"
              aria-expanded={isOpen}
            >
              <span className="sr-only">
                {isOpen ? "Close menu" : "Open menu"}
              </span>
              <HiOutlineMenuAlt4 className="h-6 w-6" aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Enhanced Dropdown with Animations */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute top-16 left-0 right-0 bg-gray-900/95 backdrop-blur-sm shadow-xl z-50 md:hidden border-t border-gray-800/50 overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <motion.div 
              className="py-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {[
                { href: "/jobs", label: "Verified Jobs" },
                { href: "/post", label: "Create Job" },
                { href: "/applications", label: "Job Applications" },
                { href: "/dashboard/admin", label: "Admin Dashboard" },
                { href: "/dashboard/employer", label: "Employer Dashboard" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * index + 0.1 }}
                >
                  <Link 
                    href={item.href}
                    className={`block px-5 py-3.5 text-base font-medium rounded-md mx-2 my-1 transition-all duration-200 ${pathname === item.href 
                      ? "text-white bg-gradient-to-r from-green-500/20 to-blue-500/20 border-l-2 border-blue-500" 
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-white hover:border-l-2 hover:border-green-400"}`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div 
              className="px-4 py-5 mt-2 border-t border-gray-800/30 bg-gray-800/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex justify-center">
                <div className="w-full max-w-xs bg-gradient-to-br from-gray-900/80 to-gray-800/80 p-3.5 rounded-xl shadow-lg border border-gray-700/30">
                  <div className="flex flex-col space-y-2">
                    <div className="text-sm text-gray-400 font-medium mb-1 text-center">Connect Wallet</div>
                    <ConnectButton
                      showBalance={false}
                      accountStatus="full"
                      chainStatus="icon"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
