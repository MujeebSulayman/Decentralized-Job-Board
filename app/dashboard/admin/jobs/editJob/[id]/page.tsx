"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { JobType, WorkMode, JobStruct } from "@/utils/type.dt";
import { uploadToIPFS, getIPFSGatewayUrl } from "@/utils/ipfsUpload";
import { getJob, editJob } from "@/services/blockchain";
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

const EditJobPage = () => {
    const params = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [logoPreview, setLogoPreview] = useState<string>("");
    const [formData, setFormData] = useState({
        orgName: "",
        title: "",
        description: "",
        orgEmail: "",
        logoCID: "",
        minimumSalary: "",
        maximumSalary: "",
        expirationDays: 30,
        jobType: JobType.FullTime,
        workMode: WorkMode.Remote,
        customFields: [] as CustomFieldState[]
    });

    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder: 'Write a detailed job description...' }),
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px]',
            },
        },
        content: '',
    });

    const [customFields, setCustomFields] = useState<CustomFieldState[]>([
        { fieldName: "", isRequired: false },
    ]);

    useEffect(() => {
        fetchJobDetails();
    }, [params.id]);

    useEffect(() => {
        if (editor && formData.description) {
            editor.commands.setContent(formData.description);
        }
    }, [editor, formData.description]);

    const fetchJobDetails = async () => {
        try {
            const jobData = await getJob(Number(params.id));
            setFormData({
                orgName: jobData.orgName,
                title: jobData.title,
                description: jobData.description,
                orgEmail: jobData.orgEmail,
                logoCID: jobData.logoCID,
                minimumSalary: jobData.minimumSalary.toString(),
                maximumSalary: jobData.maximumSalary.toString(),
                expirationDays: 30,
                jobType: jobData.jobType,
                workMode: jobData.workMode,
                customFields: jobData.customField
            });

            setCustomFields(jobData.customField);
            setLogoPreview(getIPFSGatewayUrl(jobData.logoCID));
        } catch (error) {
            console.error('Error fetching job details:', error);
            toast.error('Failed to fetch job details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const { cid } = await uploadToIPFS(file);
            setFormData(prev => ({ ...prev, logoCID: cid }));
            setLogoPreview(URL.createObjectURL(file));
            toast.success('Logo uploaded successfully');
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Failed to upload logo');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { customFields, ...rest } = formData;
            const fieldNames = customFields.map(field => field.fieldName);
            const isRequired = customFields.map(field => field.isRequired);

            await editJob({
                id: Number(params.id),
                ...rest,
                fieldName: fieldNames,
                isRequired: isRequired,
            });

            toast.success('Job updated successfully');
            router.push(`/dashboard/admin/jobs/${params.id}`);
        } catch (error) {
            console.error('Error updating job:', error);
            toast.error('Failed to update job');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCustomField = () => {
        setCustomFields([...customFields, { fieldName: "", isRequired: false }]);
    };

    const handleRemoveCustomField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const handleCustomFieldChange = (
        index: number,
        field: string,
        value: string | boolean
    ) => {
        const updatedFields = [...customFields];
        updatedFields[index] = {
            ...updatedFields[index],
            [field]: value,
        };
        setCustomFields(updatedFields);
    };

    return (
        <div className="min-h-screen bg-[#0F172A]">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-[#1E293B]/95 backdrop-blur-md border-b border-[#334155]">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back</span>
                        </button>
                        <h1 className="text-xl font-semibold text-white">Edit Job</h1>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Company Logo */}
                        <div className="bg-[#1E293B] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Company Logo</h2>
                            <div className="flex items-center space-x-6">
                                <div className="relative w-24 h-24">
                                    <Image
                                        src={logoPreview || '/placeholder-image.png'}
                                        alt="Company Logo"
                                        fill
                                        className="rounded-lg object-cover"
                                    />
                                </div>
                                <div>
                                    <label className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg cursor-pointer">
                                        <span>Change Logo</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div className="bg-[#1E293B] rounded-xl p-6 space-y-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        value={formData.orgName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, orgName: e.target.value }))}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Email</label>
                                    <input
                                        type="email"
                                        value={formData.orgEmail}
                                        onChange={(e) => setFormData(prev => ({ ...prev, orgEmail: e.target.value }))}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Job Type</label>
                                    <select
                                        value={formData.jobType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, jobType: Number(e.target.value) }))}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value={JobType.FullTime}>Full Time</option>
                                        <option value={JobType.PartTime}>Part Time</option>
                                        <option value={JobType.Internship}>Internship</option>
                                        <option value={JobType.Freelance}>Freelance</option>
                                        <option value={JobType.Contract}>Contract</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Work Mode</label>
                                    <select
                                        value={formData.workMode}
                                        onChange={(e) => setFormData(prev => ({ ...prev, workMode: Number(e.target.value) }))}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value={WorkMode.Remote}>Remote</option>
                                        <option value={WorkMode.Onsite}>Onsite</option>
                                        <option value={WorkMode.Hybrid}>Hybrid</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Salary</label>
                                    <input
                                        type="number"
                                        value={formData.minimumSalary}
                                        onChange={(e) => setFormData(prev => ({ ...prev, minimumSalary: e.target.value }))}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Salary</label>
                                    <input
                                        type="number"
                                        value={formData.maximumSalary}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maximumSalary: e.target.value }))}
                                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Job Description */}
                        <div className="bg-[#1E293B] rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Job Description</h2>
                            <div className="min-h-[200px] w-full bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                                <EditorContent editor={editor} />
                            </div>
                            <style jsx global>{`
                                .ProseMirror p.is-editor-empty:first-child::before {
                                    color: #666;
                                    content: attr(data-placeholder);
                                    float: left;
                                    height: 0;
                                    pointer-events: none;
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
                            `}</style>
                        </div>

                        {/* Custom Requirements Section */}
                        <div className="bg-[#1E293B] rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Custom Requirements</h2>
                                <button
                                    type="button"
                                    onClick={handleAddCustomField}
                                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Add Requirement</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {customFields.map((field, index) => (
                                    <div key={index} className="flex items-start space-x-4">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={field.fieldName}
                                                onChange={(e) =>
                                                    handleCustomFieldChange(index, "fieldName", e.target.value)
                                                }
                                                placeholder="Enter requirement"
                                                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <label className="flex items-center space-x-2 text-gray-300">
                                                <input
                                                    type="checkbox"
                                                    checked={field.isRequired}
                                                    onChange={(e) =>
                                                        handleCustomFieldChange(
                                                            index,
                                                            "isRequired",
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="form-checkbox h-4 w-4 text-indigo-500 rounded border-gray-700 bg-gray-900/50 focus:ring-0"
                                                />
                                                <span className="text-sm">Required</span>
                                            </label>
                                            {customFields.length > 1 && (
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
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button Section */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <span>Update Job</span>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default withAdminLayout(EditJobPage); 