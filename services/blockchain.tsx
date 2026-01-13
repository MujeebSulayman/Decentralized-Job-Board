import address from "../contracts/contractAddress.json";
import abi from "../contracts/JobBoard.json";
import { ethers } from "ethers";
import {
  ApplicationState,
  ApplicationStruct,
  JobPostParams,
  JobStruct,
} from "@/utils/type.dt";

const toWei = (num: number) => ethers.parseEther(num.toString());

const fromWei = (num: number | string | null): string => {
  if (num == null || num === undefined) {
    return "0";
  }
  return ethers.formatEther(num.toString());
};

let ethereum: any;
let tx: any;



if (typeof window !== "undefined") ethereum = (window as any).ethereum;

const getEthereumContract = async () => {
  const accounts = await ethereum?.request?.({ method: "eth_accounts" });

  if (accounts?.length > 0) {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const contracts = new ethers.Contract(address.JobBoard, abi.abi, signer);

    return contracts;
  } else {
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL
    );
    const contracts = new ethers.Contract(address.JobBoard, abi.abi, provider);

    return contracts;
  }
};

const updateServiceFee = async (newFee: number): Promise<void> => {
  if (!ethereum) {
    reportError("Please install a wallet provider");
    return Promise.reject(new Error("Browser provider not found"));
  }
  try {
    const contract = await getEthereumContract();
    tx = await contract.updateServiceFee(newFee);
    await tx.wait();
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const grantEmployerRole = async (roleAddress: string): Promise<void> => {
  if (!ethereum) {
    reportError("Please install a wallet provider");
    return Promise.reject(new Error("Browser provider not found"));
  }
  try {
    const contract = await getEthereumContract();
    tx = await contract.grantEmployerRole(roleAddress);
    await tx.wait();
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const postJob = async (job: JobPostParams): Promise<void> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  try {
    console.log("Starting blockchain transaction with params:", job);

    const contract = await getEthereumContract();
    const serviceFee = await contract.serviceFee();

    console.log("Preparing transaction with values:", {
      orgName: job.orgName,
      title: job.title,
      description: job.description,
      orgEmail: job.orgEmail,
      logoCID: job.logoCID,
      fieldName: job.fieldName,
      isRequired: job.isRequired,
      jobType: job.jobType,
      workMode: job.workMode,
      minimumSalary: job.minimumSalary,
      maximumSalary: job.maximumSalary,
      expirationDays: job.expirationDays,
      serviceFee: serviceFee.toString()
    });

    const tx = await contract.postJob(
      job.orgName,
      job.title,
      job.description,
      job.orgEmail,
      job.logoCID,
      job.fieldName,
      job.isRequired,
      job.jobType,
      job.workMode,
      job.minimumSalary,
      job.maximumSalary,
      job.expirationDays,
      { value: serviceFee }
    );

    console.log("Transaction sent:", tx);
    const receipt = await tx.wait();
    console.log("Transaction receipt:", receipt);

    return Promise.resolve(tx);
  } catch (error) {
    console.error("Blockchain transaction error:", error);
    reportError(error);
    return Promise.reject(error);
  }
};

const editJob = async (job: JobPostParams): Promise<void> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  try {
    const contract = await getEthereumContract();
    tx = await contract.editJob(
      job.id,
      job.orgName,
      job.title,
      job.description,
      job.orgEmail,
      job.logoCID,
      job.fieldName,
      job.isRequired,
      job.jobType,
      job.workMode,
      job.minimumSalary,
      job.maximumSalary
    );
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const deleteJob = async (jobId: number): Promise<void> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  try {
    const contract = await getEthereumContract();
    tx = await contract.deleteJob(jobId);
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const isJobExpired = async (jobId: number): Promise<void> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  try {
    const contract = await getEthereumContract();
    tx = await contract.isJobExpired(jobId);
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};
const checkJobExpiration = async (jobId: number): Promise<void> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  try {
    const contract = await getEthereumContract();
    tx = await contract.checkJobExpiration(jobId);
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};
const expireJob = async (jobId: number): Promise<void> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  try {
    const contract = await getEthereumContract();
    tx = await contract.expireJob(jobId);
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const applyForJob = async (
  jobId: number,
  name: string,
  email: string,
  phoneNumber: string,
  location: string,
  fieldResponses: string[],
  cvCID: string,
  portfolioLink: string,
  experience: string,
  expectedSalary: string,
  github: string
): Promise<any> => {
  if (!ethereum) {
    throw new Error("Please install MetaMask to use this application.");
  }

  try {
    const contract = await getEthereumContract();
    const tx = await contract.submitApplication(
      jobId,
      name,
      email,
      phoneNumber,
      location,
      fieldResponses,
      cvCID,
      portfolioLink,
      experience,
      expectedSalary,
      github
    );
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    reportError(error);
    throw error;
  }
};

const updateApplicationStatus = async (
  jobId: number,
  applicant: string,
  newState: ApplicationState
) => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  try {
    const contract = await getEthereumContract();
    tx = await contract.updateApplicationStatus(jobId, applicant, newState);
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const closeJob = async (jobId: number): Promise<void> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  try {
    const contract = await getEthereumContract();
    tx = await contract.closeJob(jobId);
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const getJob = async (jobId: number): Promise<JobStruct> => {
  const contract = await getEthereumContract();
  const job = await contract.getJob(jobId);
  return job;
};

const getAllJobs = async (): Promise<JobStruct[]> => {
  const contract = await getEthereumContract();
  const jobs = await contract.getAllJobs();
  return jobs;
};

const getMyJobs = async (): Promise<JobStruct[]> => {
  const contract = await getEthereumContract();
  const jobs = await contract.getMyJobs();
  return jobs;
};

const getJobApplicants = async (
  jobId: number
): Promise<ApplicationStruct[]> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  const contract = await getEthereumContract();
  const jobApplicants = await contract.getJobApplicants(jobId);
  return jobApplicants;
};

const getJobApplicantDetails = async (
  jobId: number,
  applicant: string
): Promise<ApplicationStruct | null> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  try {
    const contract = await getEthereumContract();
    const jobApplicants = await contract.getJobApplicants(jobId);

    console.log("Job Applicants:", jobApplicants); // Debug log

    const applicantIndex = jobApplicants.findIndex(
      (address: string) => address.toLowerCase() === applicant.toLowerCase()
    );

    console.log("Applicant Index:", applicantIndex); // Debug log

    if (applicantIndex === -1) return null;

    const jobApplicantDetails = await contract.getJobApplicantDetails(
      jobId,
      applicantIndex
    );

    console.log("Job Applicant Details:", jobApplicantDetails); // Debug log

    return jobApplicantDetails;
  } catch (error) {
    console.error("Error fetching job applicant details:", error);
    return null;
  }
};

const getJobApplicationCount = async (jobId: number): Promise<number> => {
  try {
    const contract = await getEthereumContract();
    const count = await contract.getJobApplicationCount(jobId);
    return count;
  } catch (error) {
    console.error("Error fetching job application count:", error);
    return 0;
  }
};

const getJobApplications = async (
  jobId: number
): Promise<ApplicationStruct[]> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  try {
    const contract = await getEthereumContract();
    const applications = await contract.getJobApplications(jobId);
    return applications;
  } catch (error) {
    console.error("Error fetching job applications:", error);
    return [];
  }
};

const withdrawFunds = async (): Promise<void> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  try {
    const contract = await getEthereumContract();
    const tx = await contract.withdrawFunds();
    await tx.wait();
  } catch (error) {
    console.error("Error withdrawing funds:", error);
    throw error;
  }
};

const getServiceFee = async (): Promise<string> => {
  try {
    const contract = await getEthereumContract();
    const fee = await contract.serviceFee();
    return fromWei(fee);
  } catch (error) {
    console.error("Error getting service fee:", error);
    throw error;
  }
};

export const submitApplication = async (
  jobId: number,
  name: string,
  email: string,
  phoneNumber: string,
  location: string,
  fieldResponses: string[],
  cvCID: string,
  portfolioLink: string,
  experience: string,
  expectedSalary: string,
  github: string
) => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }
  try {
    const contract = await getEthereumContract();
    const tx = await contract.submitApplication(
      jobId,
      name,
      email,
      phoneNumber,
      location,
      fieldResponses,
      cvCID,
      portfolioLink,
      experience,
      expectedSalary,
      github
    );
    await tx.wait();
    return tx;
  } catch (error) {
    console.error("Error submitting application:", error);
    throw error;
  }
};

export {
  updateServiceFee,
  postJob,
  editJob,
  deleteJob,
  isJobExpired,
  checkJobExpiration,
  expireJob,
  applyForJob,
  updateApplicationStatus,
  closeJob,
  getJob,
  getAllJobs,
  getMyJobs,
  getJobApplicants,
  getJobApplicantDetails,
  getJobApplicationCount,
  getJobApplications,
  withdrawFunds,
  getServiceFee,
  grantEmployerRole
};
