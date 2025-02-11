"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { postJob } from "@/services/blockchain";
import { JobType, WorkMode } from "@/utils/type.dt";
import AdminDashboardLayout from "@/components/layouts/AdminDashboardLayout";
import { toast } from "react-toastify";
import { 
  CubeTransparentIcon, 
  PlusCircleIcon, 
  TrashIcon, 
  CheckCircleIcon,
  PhotoIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/solid";
import { uploadToIPFS, validateFileForUpload } from "@/utils/ipfsUpload";

const CreateJobPage: React.FC = () => {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    orgName: "",
    title: "",
    description: "",
    orgEmail: "",
    logoCID: "",
    fieldName: [""],
    isRequired: [false],
    jobType: JobType.FullTime,
    workMode: WorkMode.Remote,
    minimumSalary: "",
    maximumSalary: "",
    expirationDays: 30,
  });

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delayChildren: 0.2,
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const [activeSection, setActiveSection] = useState<
    | 'jobDetails'
    | 'companyInfo'
    | 'customFields'
    | 'salaryDetails'
  >('jobDetails');

  const sectionVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: 'spring', 
        stiffness: 100 
      } 
    },
    exit: { opacity: 0, x: 50 }
  };

  const renderSectionHeader = (
    title: string, 
    description: string, 
    icon: React.ReactNode
  ) => (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-4 mb-6 bg-gray-800/50 p-4 rounded-xl"
    >
      <div className="text-purple-400">{icon}</div>
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </motion.div>
  );

  const renderProgressIndicator = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex space-x-2 mb-6"
    >
      {['jobDetails', 'companyInfo', 'customFields', 'salaryDetails'].map((section, index) => (
        <motion.div
          key={section}
          className={`h-2 rounded-full transition-all duration-300 ${
            activeSection === section 
              ? 'bg-purple-500 w-12' 
              : 'bg-gray-700 w-6'
          }`}
          whileHover={{ scale: 1.1 }}
          onClick={() => setActiveSection(section as any)}
        />
      ))}
    </motion.div>
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCustomFieldChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    const newFieldName = [...formData.fieldName];
    const newIsRequired = [...formData.isRequired];

    if (name === "fieldName") {
      newFieldName[index] = value;
    } else if (name === "isRequired") {
      newIsRequired[index] = type === "checkbox" ? checked : false;
    }

    setFormData((prevData) => ({
      ...prevData,
      fieldName: newFieldName,
      isRequired: newIsRequired,
    }));
  };

  const addCustomField = () => {
    if (formData.fieldName.length < 5) {  // Limit custom fields
      setFormData((prevData) => ({
        ...prevData,
        fieldName: [...prevData.fieldName, ""],
        isRequired: [...prevData.isRequired, false],
      }));
    } else {
      toast.warn("Maximum 5 custom fields allowed");
    }
  };

  const removeCustomField = (index: number) => {
    const newFieldName = formData.fieldName.filter((_, i) => i !== index);
    const newIsRequired = formData.isRequired.filter((_, i) => i !== index);

    setFormData((prevData) => ({
      ...prevData,
      fieldName: newFieldName,
      isRequired: newIsRequired,
    }));
  };

  const validateForm = () => {
    const {
      orgName,
      title,
      description,
      orgEmail,
      minimumSalary,
      maximumSalary,
      logoCID,
      expirationDays
    } = formData;

    // Comprehensive validation matching contract requirements
    if (!orgName.trim()) {
      toast.error("Organisation name cannot be empty");
      return false;
    }

    if (!title.trim()) {
      toast.error("Title cannot be empty");
      return false;
    }

    if (!description.trim()) {
      toast.error("Description cannot be empty");
      return false;
    }

    if (!orgEmail.trim() || !orgEmail.includes("@")) {
      toast.error("Valid Organisation Email is required");
      return false;
    }

    if (!minimumSalary.trim()) {
      toast.error("Minimum Salary is required");
      return false;
    }

    if (!maximumSalary.trim()) {
      toast.error("Maximum Salary is required");
      return false;
    }

    if (!logoCID.trim()) {
      toast.error("Logo cannot be empty");
      return false;
    }

    if (expirationDays <= 0 || expirationDays > 90) {
      toast.error("Expiration days must be between 1 and 90");
      return false;
    }

    return true;
  };

  const removeLogoPreview = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = ''; // Reset file input
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    try {
      // Validate file
      validateFileForUpload(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Set file
      setLogoFile(file);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) {
      toast.error('Please select a logo first');
      return null;
    }

    try {
      setIsUploading(true);
      const { cid } = await uploadToIPFS(logoFile);
      
      toast.success('Logo uploaded successfully');
      return cid;
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Logo upload failed: ${error.message}`);
      }
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    // Upload logo first
    const logoCID = await uploadLogo();

    if (!logoCID) {
      return; // Stop submission if logo upload fails
    }

    try {
      await postJob({ 
        ...formData, 
        logoCID 
      });
      toast.success("Job Posted Successfully!");
      router.push("/dashboard/admin/jobs");
    } catch (error) {
      console.error("Job Posting Error:", error);
      toast.error("Failed to Post Job. Please try again.");
    }
  };

  return (
    <AdminDashboardLayout>
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8"
      >
        <motion.div 
          variants={itemVariants}
          className="max-w-6xl mx-auto bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-2xl p-10"
        >
          <motion.h1 
            variants={itemVariants}
            className="text-4xl font-bold mb-8 text-center flex items-center justify-center"
          >
            <SparklesIcon className="w-10 h-10 mr-4 text-purple-500" />
            Create Web3 Job Listing
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mb-8"
          >
            {renderProgressIndicator()}
          </motion.div>

          <AnimatePresence>
            {activeSection === 'jobDetails' && (
              <motion.div 
                key="jobDetails"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={sectionVariants}
                className="space-y-6"
              >
                {renderSectionHeader('Job Details', 'Enter job title, description and other details', <CubeTransparentIcon className="w-6 h-6" />)}

                {/* Job Details */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-all duration-300"
                    placeholder="Enter job title"
                    required
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Job Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-all duration-300 h-32"
                    placeholder="Describe the job in detail"
                    required
                  />
                </motion.div>

                {/* Job Type and Work Mode */}
                <motion.div 
                  variants={itemVariants}
                  className="grid md:grid-cols-3 gap-6"
                >
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Job Type
                    </label>
                    <select
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-all duration-300"
                      required
                    >
                      {Object.values(JobType).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Work Mode
                    </label>
                    <select
                      name="workMode"
                      value={formData.workMode}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-all duration-300"
                      required
                    >
                      {Object.values(WorkMode).map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Job Expiration (Days)
                    </label>
                    <input
                      type="number"
                      name="expirationDays"
                      value={formData.expirationDays}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-all duration-300"
                      min={1}
                      max={90}
                      required
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {activeSection === 'companyInfo' && (
              <motion.div 
                key="companyInfo"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={sectionVariants}
                className="space-y-6"
              >
                {renderSectionHeader('Company Information', 'Enter company details', <CubeTransparentIcon className="w-6 h-6" />)}

                {/* Organization Details */}
                <motion.div 
                  variants={itemVariants}
                  className="grid md:grid-cols-2 gap-6"
                >
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      name="orgName"
                      value={formData.orgName}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-all duration-300"
                      placeholder="Enter organization name"
                      required
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Organization Email
                    </label>
                    <input
                      type="email"
                      name="orgEmail"
                      value={formData.orgEmail}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-all duration-300"
                      placeholder="Enter organization email"
                      required
                    />
                  </motion.div>
                </motion.div>

                {/* Logo Upload */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <motion.button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                      <PhotoIcon className="w-5 h-5 mr-2" />
                      Upload Logo
                    </motion.button>

                    <AnimatePresence>
                      {logoPreview && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center space-x-2"
                        >
                          <img
                            src={logoPreview}
                            alt="Logo Preview"
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          {isUploading ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 1, 
                                ease: "linear" 
                              }}
                              className="w-8 h-8 border-4 border-t-purple-500 border-gray-200 rounded-full"
                            />
                          ) : (
                            <motion.button
                              type="button"
                              onClick={removeLogoPreview}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-red-500 hover:text-red-600"
                            >
                              <TrashIcon className="w-6 h-6" />
                            </motion.button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeSection === 'customFields' && (
              <motion.div 
                key="customFields"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={sectionVariants}
                className="space-y-6"
              >
                {renderSectionHeader('Custom Fields', 'Add custom fields for your job listing', <CubeTransparentIcon className="w-6 h-6" />)}

                {/* Custom Fields */}
                <motion.div variants={itemVariants}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Custom Fields</h2>
                    <motion.button
                      type="button"
                      onClick={addCustomField}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                      <PlusCircleIcon className="w-5 h-5 mr-2" />
                      Add Field
                    </motion.button>
                  </div>

                  {formData.fieldName.map((field, index) => (
                    <motion.div 
                      key={index} 
                      variants={itemVariants}
                      className="flex items-center space-x-4 mb-4 bg-gray-700 p-4 rounded-lg"
                    >
                      <input
                        type="text"
                        name="fieldName"
                        value={field}
                        onChange={(e) => handleCustomFieldChange(index, e)}
                        className="flex-grow bg-gray-600 border-2 border-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-all duration-300"
                        placeholder="Enter custom field name"
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="isRequired"
                          checked={formData.isRequired[index]}
                          onChange={(e) => handleCustomFieldChange(index, e)}
                          className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <label className="text-sm text-gray-300">Required</label>
                      </div>
                      {formData.fieldName.length > 1 && (
                        <motion.button
                          type="button"
                          onClick={() => removeCustomField(index)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-red-500 hover:text-red-600 transition-colors duration-300"
                        >
                          <TrashIcon className="h-6 w-6" />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {activeSection === 'salaryDetails' && (
              <motion.div 
                key="salaryDetails"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={sectionVariants}
                className="space-y-6"
              >
                {renderSectionHeader('Salary Details', 'Enter salary details for your job listing', <CubeTransparentIcon className="w-6 h-6" />)}

                {/* Salary Details */}
                <motion.div 
                  variants={itemVariants}
                  className="grid md:grid-cols-2 gap-6"
                >
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Minimum Salary
                    </label>
                    <input
                      type="text"
                      name="minimumSalary"
                      value={formData.minimumSalary}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-all duration-300"
                      placeholder="Enter minimum salary"
                      required
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Maximum Salary
                    </label>
                    <input
                      type="text"
                      name="maximumSalary"
                      value={formData.maximumSalary}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-all duration-300"
                      placeholder="Enter maximum salary"
                      required
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            variants={itemVariants} 
            className="flex justify-between mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const sections = ['jobDetails', 'companyInfo', 'customFields', 'salaryDetails'];
                const currentIndex = sections.indexOf(activeSection);
                if (currentIndex > 0) {
                  setActiveSection(sections[currentIndex - 1] as any);
                }
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center"
              disabled={activeSection === 'jobDetails'}
            >
              <ChevronLeftIcon className="w-5 h-5 mr-2" />
              Previous
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const sections = ['jobDetails', 'companyInfo', 'customFields', 'salaryDetails'];
                const currentIndex = sections.indexOf(activeSection);
                if (currentIndex < sections.length - 1) {
                  setActiveSection(sections[currentIndex + 1] as any);
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center"
            >
              Next
              <ChevronRightIcon className="w-5 h-5 ml-2" />
            </motion.button>
          </motion.div>

          {activeSection === 'salaryDetails' && (
            <motion.div 
              variants={itemVariants}
              className="text-center mt-8"
            >
              <motion.button
                type="submit"
                onClick={handleSubmit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform"
              >
                Post Job
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AdminDashboardLayout>
  );
};

export default CreateJobPage;
