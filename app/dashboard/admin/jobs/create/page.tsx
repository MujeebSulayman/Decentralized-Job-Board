"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { JobType, WorkMode } from "@/utils/type.dt";
import { uploadToIPFS } from "@/utils/ipfsUpload";
import { postJob, getServiceFee } from "@/services/blockchain";
import Image from "next/image";
import withAdminLayout from "@/components/hoc/withAdminLayout";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

interface CustomFieldState {
  fieldName: string;
  isRequired: boolean;
}

const CreateJobPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [formData, setFormData] = useState({
    orgName: "",
    title: "",
    description: "",
    orgEmail: "",
    logo: "",
    minimumSalary: "",
    maximumSalary: "",
    expirationDays: 30,
    jobType: JobType.FullTime,
    workMode: WorkMode.Remote,
    customFields: [] as { fieldName: string; isRequired: boolean }[]
  });

  const [customFields, setCustomFields] = useState<CustomFieldState[]>([
    { fieldName: "", isRequired: false },
  ]);

  const [serviceFee, setServiceFee] = useState<string>("0");

  useEffect(() => {
    const fetchServiceFee = async () => {
      try {
        const fee = await getServiceFee();
        setServiceFee(fee);
      } catch (error) {
        console.error("Error fetching service fee:", error);
        toast.error("Failed to fetch service fee");
      }
    };

    fetchServiceFee();
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Write a detailed job description...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setFormData(prev => ({
        ...prev,
        description: editor.getHTML()
      }));
    },
  });

  const inputClassName = "w-full px-4 py-3 bg-black/20 border border-purple-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent transition-all duration-200 font-dm-sans placeholder:text-gray-500";

  const labelClassName = "block text-sm font-medium text-gray-200 mb-2 font-dm-sans";

  const selectWrapperClassName = "relative";
  const selectIconClassName = "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400";
  const optionClassName = "px-4 py-2 text-gray-300 bg-black/90 hover:bg-purple-500/20 cursor-pointer";
  const selectClassName = "w-full px-4 py-3 bg-black/20 border border-purple-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent transition-all duration-200 font-dm-sans text-gray-300 appearance-none";

  const formGroupClassName = "space-y-2 relative group";

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('file', file);

      // Upload to IPFS
      const { cid } = await uploadToIPFS(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Update form with IPFS URL
      setFormData(prev => ({
        ...prev,
        logo: cid
      }));

      toast.success('Logo uploaded successfully');
    } catch (error) {
      toast.error('Error uploading logo: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddCustomField = () => {
    setCustomFields((prev) => [...prev, { fieldName: "", isRequired: false }]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (
    index: number,
    field: keyof CustomFieldState,
    value: string | boolean
  ) => {
    setCustomFields((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleExpirationChange = (value: string) => {
    const days = parseInt(value);
    if (days > 45) {
      toast.warning("Maximum allowed posting duration is 45 days");
    }
    setFormData((prev) => ({ ...prev, expirationDays: Math.min(45, days) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Form validation
      if (!formData.orgName.trim()) throw new Error("Organization name is required");
      if (!formData.title.trim()) throw new Error("Job title is required");
      if (!formData.description.trim()) throw new Error("Job description is required");
      if (!formData.orgEmail.trim()) throw new Error("Organization email is required");
      if (!formData.logo) throw new Error("Company logo is required");
      if (!formData.minimumSalary.trim()) throw new Error("Minimum salary is required");
      if (!formData.maximumSalary.trim()) throw new Error("Maximum salary is required");

      // Log all form data before submission
      console.log("Submitting job with data:", {
        orgName: formData.orgName,
        title: formData.title,
        description: formData.description,
        orgEmail: formData.orgEmail,
        logoCID: formData.logo,
        fieldName: customFields.map(field => field.fieldName),
        isRequired: customFields.map(field => field.isRequired),
        jobType: formData.jobType,
        workMode: formData.workMode,
        minimumSalary: formData.minimumSalary,
        maximumSalary: formData.maximumSalary,
        expirationDays: formData.expirationDays
      });

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.orgEmail)) {
        throw new Error("Please enter a valid email address");
      }

      setIsLoading(true);
      const processingToast = toast.loading("Processing your transaction...");

      // Log the exact parameters being sent to the blockchain
      const jobParams = {
        orgName: formData.orgName,
        title: formData.title,
        description: formData.description,
        orgEmail: formData.orgEmail,
        logoCID: formData.logo,
        fieldName: customFields.map(field => field.fieldName),
        isRequired: customFields.map(field => field.isRequired),
        jobType: formData.jobType,
        workMode: formData.workMode,
        minimumSalary: formData.minimumSalary,
        maximumSalary: formData.maximumSalary,
        expirationDays: formData.expirationDays
      };

      console.log("Sending to blockchain:", jobParams);

      // Log the service fee
      console.log("Service Fee:", serviceFee);

      // Add blockchain transaction logging
      const transaction = await postJob(jobParams);
      console.log("Transaction response:", transaction);

      toast.update(processingToast, {
        render: "Job posted successfully! Redirecting...",
        type: "success",
        isLoading: false,
        autoClose: 2000
      });

      setTimeout(() => {
        router.push("/dashboard/admin/jobs");
      }, 2000);

    } catch (error) {
      console.error("Error submitting job:", error);
      toast.error(error instanceof Error ? error.message : "Failed to post job");
    } finally {
      setIsLoading(false);
    }
  };

  const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-2 p-2 bg-black/40 border border-purple-500/20 rounded-t-lg">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-purple-500/20 transition-colors ${editor.isActive('bold') ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h8a4 4 0 100-8H6v8zm0 0h8a4 4 0 110 8H6v-8z" />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-purple-500/20 transition-colors ${editor.isActive('italic') ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l-4 4M6 16l4-4" />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-purple-500/20 transition-colors ${editor.isActive('underline') ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M7 20h10" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-purple-500/20 transition-colors ${editor.isActive('bulletList') ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-purple-500/20 transition-colors ${editor.isActive('orderedList') ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h12M7 12h12M7 17h12M3 7h.01M3 12h.01M3 17h.01" />
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-purple-500/20 transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h14" />
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-purple-500/20 transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M7 12h10M6 18h12" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-purple-500/20">
          {/* Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-purple-900/50 to-purple-800/30 border-b border-purple-500/20">
            <h1 className="text-2xl font-bold text-white font-orbitron">Create New Job Posting</h1>
            <p className="mt-1 text-purple-200 font-dm-sans">Fill in the details below to create a new job opportunity</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Service Fee Notice */}
            <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-purple-300">
                    Service Fee: <span className="font-bold">{serviceFee} ETH</span>
                  </p>
                  <p className="text-xs text-purple-400/70 mt-0.5">
                    This fee will be charged when posting the job
                  </p>
                </div>
              </div>
            </div>

            {/* Logo Upload Section */}
            <div className="p-6 bg-gray-800/50 rounded-xl border border-purple-500/20">
              <label className="block text-sm font-semibold text-purple-200 mb-4">Company Logo</label>
              <div className="flex items-center space-x-6">
                {logoPreview ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden ring-2 ring-purple-500/30">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-800 border border-purple-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`flex items-center justify-center w-full px-4 py-3 bg-black/20 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition-all duration-200 cursor-pointer group ${isUploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    {isUploading ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-purple-400">Uploading... {uploadProgress}%</span>
                      </div>
                    ) : (
                      <>
                        <span className="mr-2">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </span>
                        <span className="text-gray-300 group-hover:text-purple-400 transition-colors duration-200">
                          {formData.logo ? 'Change Logo' : 'Upload Logo'}
                        </span>
                      </>
                    )}
                  </label>

                  {/* Upload Progress Bar */}
                  {isUploading && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 rounded-full h-2 transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {formData.logo && !isUploading && (
                    <div className="mt-2 flex items-center space-x-2 p-2 bg-black/40 rounded-lg border border-purple-500/20">
                      <img
                        src={formData.logo}
                        alt="Company Logo"
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">Logo uploaded successfully</p>
                        <p className="text-xs text-gray-500 truncate">{formData.logo}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className={formGroupClassName}>
                  <label htmlFor="orgName" className={labelClassName}>Organization Name</label>
                  <input
                    type="text"
                    id="orgName"
                    className={inputClassName}
                    value={formData.orgName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, orgName: e.target.value }))}
                    required
                  />
                </div>

                <div className={formGroupClassName}>
                  <label htmlFor="title" className={labelClassName}>Job Title</label>
                  <input
                    type="text"
                    id="title"
                    className={inputClassName}
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className={formGroupClassName}>
                  <label htmlFor="orgEmail" className={labelClassName}>Organization Email</label>
                  <input
                    type="email"
                    id="orgEmail"
                    className={inputClassName}
                    value={formData.orgEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, orgEmail: e.target.value }))}
                    required
                  />
                </div>

                <div className={formGroupClassName}>
                  <label htmlFor="expirationDays" className={labelClassName}>
                    Expiration (Days)
                    <span className="ml-1 text-xs text-gray-400">(Max: 45 days)</span>
                  </label>
                  <input
                    type="number"
                    id="expirationDays"
                    min="1"
                    max="45"
                    className={inputClassName}
                    value={formData.expirationDays}
                    onChange={(e) => handleExpirationChange(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="space-y-6">
              <div className={formGroupClassName}>
                <label htmlFor="description" className={labelClassName}>Job Description</label>
                <div className="overflow-hidden rounded-lg border border-purple-500/20">
                  <MenuBar editor={editor} />
                  <EditorContent
                    editor={editor}
                    className="prose prose-invert max-w-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={formGroupClassName}>
                  <label htmlFor="jobType" className={labelClassName}>Job Type</label>
                  <div className={selectWrapperClassName}>
                    <select
                      id="jobType"
                      className={`${selectClassName} pr-10`}
                      value={formData.jobType}
                      onChange={(e) => setFormData(prev => ({ ...prev, jobType: parseInt(e.target.value) }))}
                    >
                      {Object.entries(JobType)
                        .filter(([key]) => isNaN(Number(key)))
                        .map(([key, value]) => (
                          <option key={value} value={value} className={optionClassName}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </option>
                        ))}
                    </select>
                    <div className={selectIconClassName}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className={formGroupClassName}>
                  <label htmlFor="workMode" className={labelClassName}>Work Mode</label>
                  <div className={selectWrapperClassName}>
                    <select
                      id="workMode"
                      className={`${selectClassName} pr-10`}
                      value={formData.workMode}
                      onChange={(e) => setFormData(prev => ({ ...prev, workMode: parseInt(e.target.value) }))}
                    >
                      {Object.entries(WorkMode)
                        .filter(([key]) => isNaN(Number(key)))
                        .map(([key, value]) => (
                          <option key={value} value={value} className={optionClassName}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </option>
                        ))}
                    </select>
                    <div className={selectIconClassName}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Select the preferred working arrangement</p>
                </div>

                <div className={formGroupClassName}>
                  <label htmlFor="minimumSalary" className={labelClassName}>Minimum Salary</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="text"
                      id="minimumSalary"
                      className={`${inputClassName} pl-8`}
                      placeholder="e.g. $50,000"
                      value={formData.minimumSalary}
                      onChange={(e) => setFormData((prev) => ({ ...prev, minimumSalary: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className={formGroupClassName}>
                  <label htmlFor="maximumSalary" className={labelClassName}>Maximum Salary</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="text"
                      id="maximumSalary"
                      className={`${inputClassName} pl-8`}
                      placeholder="e.g. $80,000"
                      value={formData.maximumSalary}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maximumSalary: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Fields Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-purple-200 font-orbitron">Custom Application Fields</h3>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Add Field</span>
                </button>
              </div>

              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-1 space-y-4">
                      <div className={formGroupClassName}>
                        <input
                          type="text"
                          className={inputClassName}
                          placeholder="Field Label"
                          value={field.fieldName}
                          onChange={(e) => handleCustomFieldChange(index, 'fieldName', e.target.value)}
                        />
                      </div>
                      <div className={formGroupClassName}>
                        <label className={labelClassName}>Required</label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={field.isRequired}
                            onChange={(e) => handleCustomFieldChange(index, 'isRequired', e.target.checked)}
                            className="rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-purple-200">Required</span>
                        </label>
                      </div>
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(index)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-700/20 hover:bg-gray-700/30 text-gray-300 rounded-lg transition-all duration-200 flex items-center space-x-2 mr-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Post Job</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style jsx global>{`
        .ProseMirror {
          min-height: 200px;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          color: #fff;
        }

        .ProseMirror:focus {
          outline: none;
        }

        .ProseMirror > * + * {
          margin-top: 0.75em;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding: 0 1rem;
        }

        .ProseMirror ul {
          list-style-type: disc;
        }

        .ProseMirror ol {
          list-style-type: decimal;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          color: #666;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default withAdminLayout(CreateJobPage);