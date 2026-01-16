import address from "../contracts/contractAddress.json";

import abi from "../contracts/JobBoard.json";

import paymasterAbi from "../artifacts/contracts/JobBoardPaymaster.sol/JobBoardPaymaster.json";
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

const reportError = (error: any) => {
  console.error("Blockchain Error:", error);
  if (typeof error === "string") {
    console.error(error);
  } else if (error?.message) {
    console.error(error.message);

    // Check for NotAuthorized error (paymaster not registered)
    if (
      error.message.includes("0xea8e4eb5") ||
      error.message.includes("NotAuthorized") ||
      (error.data && error.data === "0xea8e4eb5")
    ) {
      console.error(
        "\n⚠️  PAYMASTER NOT REGISTERED ERROR\n" +
        "The paymaster contract is not registered in the JobBoard contract.\n" +
        "To fix this, run: npx hardhat run scripts/set-paymaster.js --network <network>\n" +
        "Or if you just redeployed the paymaster, the redeploy script should have set it automatically.\n"
      );
    }
  } else {
    console.error(JSON.stringify(error, null, 2));
  }
};

if (typeof window !== "undefined") ethereum = (window as any).ethereum;

const PAYMASTER_DOMAIN_NAME = "HemBoard";
const PAYMASTER_DOMAIN_VERSION = "1";
const RELAYER_DOMAIN_NAME = "HemBoardRelayer";
const RELAYER_DOMAIN_VERSION = "1";

const getReadOnlyContract = () => {
  const contractAddress = address.JobBoardProxy;
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error("NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL is not set");
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contracts = new ethers.Contract(contractAddress, abi.abi, provider);
  return contracts;
};

const getEthereumContract = async () => {
  const contractAddress = address.JobBoardProxy;

  let accounts: string[] = [];
  try {
    if (ethereum) {
      accounts = await ethereum.request({ method: "eth_accounts" });
    }
  } catch (error) {
  }

  if (accounts?.length > 0 && ethereum) {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const contracts = new ethers.Contract(contractAddress, abi.abi, signer);
    return contracts;
  } else {
    return getReadOnlyContract();
  }
};

const getReadOnlyPaymasterContract = () => {
  const paymasterAddress = address.JobBoardPaymaster;
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error("NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL is not set");
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const paymaster = new ethers.Contract(
    paymasterAddress,
    paymasterAbi.abi || paymasterAbi,
    provider
  );
  return paymaster;
};

const getPaymasterContract = async () => {
  const paymasterAddress = address.JobBoardPaymaster;

  let accounts: string[] = [];
  try {
    if (ethereum) {
      accounts = await ethereum.request({ method: "eth_accounts" });
    }
  } catch (error) {
  }

  if (accounts?.length > 0 && ethereum) {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const paymaster = new ethers.Contract(
      paymasterAddress,
      paymasterAbi.abi || paymasterAbi,
      signer
    );
    return paymaster;
  } else {
    return getReadOnlyPaymasterContract();
  }
};

const getChainId = async (): Promise<bigint> => {
  try {
    if (ethereum) {
      const provider = new ethers.BrowserProvider(ethereum);
      const network = await provider.getNetwork();
      return BigInt(network.chainId);
    }
  } catch (error) {
  }

  const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error("NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL is not set");
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  return BigInt(network.chainId);
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

    const paymaster = getReadOnlyPaymasterContract();
    const paymasterEnabled = await paymaster.paymasterEnabled();

    if (paymasterEnabled) {
      return await postJobMeta(job);
    }

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
    const paymaster = getReadOnlyPaymasterContract();
    const paymasterEnabled = await paymaster.paymasterEnabled();

    if (paymasterEnabled) {
      return await submitApplicationMeta(
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
    }

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
  try {
    const contract = getReadOnlyContract();
    const job = await contract.getJob(jobId);
    return job;
  } catch (error) {
    console.error("Error fetching job:", error);
    throw error;
  }
};

const getAllJobs = async (): Promise<JobStruct[]> => {
  try {
    const contract = getReadOnlyContract();
    const jobs = await contract.getAllJobs();
    return jobs;
  } catch (error) {
    console.error("Error fetching all jobs:", error);
    return [];
  }
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

    console.log("Job Applicants:", jobApplicants);

    const applicantIndex = jobApplicants.findIndex(
      (address: string) => address.toLowerCase() === applicant.toLowerCase()
    );

    console.log("Applicant Index:", applicantIndex);

    if (applicantIndex === -1) return null;

    const jobApplicantDetails = await contract.getJobApplicantDetails(
      jobId,
      applicantIndex
    );

    console.log("Job Applicant Details:", jobApplicantDetails);

    return jobApplicantDetails;
  } catch (error) {
    console.error("Error fetching job applicant details:", error);
    return null;
  }
};

const getJobApplicationCount = async (jobId: number): Promise<number> => {
  try {
    const contract = getReadOnlyContract();
    const count = await contract.getJobApplicationCount(jobId);
    return Number(count);
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
    const contract = getReadOnlyContract();
    const fee = await contract.serviceFee();
    return fromWei(fee);
  } catch (error) {
    console.error("Error getting service fee:", error);
    return "0.01";
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
    const paymaster = getReadOnlyPaymasterContract();
    const paymasterEnabled = await paymaster.paymasterEnabled();

    if (paymasterEnabled) {
      return await submitApplicationMeta(
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
    }

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

const getPaymasterNonce = async (userAddress: string): Promise<bigint> => {
  try {
    const paymaster = getReadOnlyPaymasterContract();
    const nonce = await paymaster.getNonce(userAddress);
    return nonce;
  } catch (error) {
    console.error("Error getting paymaster nonce:", error);
    throw error;
  }
};

const getRelayerNonce = async (userAddress: string): Promise<bigint> => {
  try {
    const relayerAddress = address.JobBoardRelayer;
    if (!relayerAddress) {
      throw new Error("Relayer contract not deployed");
    }
    const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;
    if (!rpcUrl) {
      throw new Error("NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL is not set");
    }
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const relayerAbi = ["function getNonce(address user) external view returns (uint256)"];
    const relayer = new ethers.Contract(relayerAddress, relayerAbi, provider);
    const nonce = await relayer.getNonce(userAddress);
    return nonce;
  } catch (error) {
    console.error("Error getting relayer nonce:", error);
    throw error;
  }
};

const createPostJobSignature = async (
  userAddress: string,
  orgName: string,
  title: string,
  description: string,
  orgEmail: string,
  logoCID: string,
  expirationDays: number
): Promise<string> => {
  if (!ethereum) {
    throw new Error("Please install MetaMask to use this application.");
  }

  try {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const chainId = await getChainId();
    const nonce = await getPaymasterNonce(userAddress);
    const paymasterAddress = address.JobBoardPaymaster;

    const domain = {
      name: PAYMASTER_DOMAIN_NAME,
      version: PAYMASTER_DOMAIN_VERSION,
      chainId: chainId.toString(),
      verifyingContract: paymasterAddress,
    };

    const types = {
      PostJob: [
        { name: "user", type: "address" },
        { name: "orgName", type: "string" },
        { name: "title", type: "string" },
        { name: "description", type: "string" },
        { name: "orgEmail", type: "string" },
        { name: "logoCID", type: "string" },
        { name: "expirationDays", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    };

    const value = {
      user: userAddress,
      orgName,
      title,
      description,
      orgEmail,
      logoCID,
      expirationDays,
      nonce: nonce.toString(),
    };

    const signature = await signer.signTypedData(domain, types, value);
    return signature;
  } catch (error) {
    console.error("Error creating post job signature:", error);
    throw error;
  }
};

const createSubmitApplicationSignature = async (
  userAddress: string,
  jobId: number,
  name: string,
  email: string,
  phoneNumber: string,
  location: string,
  cvCID: string
): Promise<string> => {
  if (!ethereum) {
    throw new Error("Please install MetaMask to use this application.");
  }

  try {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const chainId = await getChainId();
    const nonce = await getPaymasterNonce(userAddress);
    const paymasterAddress = address.JobBoardPaymaster;

    const domain = {
      name: PAYMASTER_DOMAIN_NAME,
      version: PAYMASTER_DOMAIN_VERSION,
      chainId: chainId.toString(),
      verifyingContract: paymasterAddress,
    };

    const types = {
      SubmitApplication: [
        { name: "user", type: "address" },
        { name: "jobId", type: "uint256" },
        { name: "name", type: "string" },
        { name: "email", type: "string" },
        { name: "phoneNumber", type: "string" },
        { name: "location", type: "string" },
        { name: "cvCID", type: "string" },
        { name: "nonce", type: "uint256" },
      ],
    };

    const value = {
      user: userAddress,
      jobId,
      name,
      email,
      phoneNumber,
      location,
      cvCID,
      nonce: nonce.toString(),
    };

    const signature = await signer.signTypedData(domain, types, value);
    return signature;
  } catch (error) {
    console.error("Error creating submit application signature:", error);
    throw error;
  }
};

const postJobMeta = async (job: JobPostParams): Promise<any> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }

  try {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    const chainId = await getChainId();

    // Step 1: Create paymaster signature
    const paymasterSignature = await createPostJobSignature(
      userAddress,
      job.orgName,
      job.title,
      job.description,
      job.orgEmail,
      job.logoCID,
      job.expirationDays
    );

    // Step 2: Encode function call to paymaster
    const paymasterAddress = address.JobBoardPaymaster;
    const paymasterInterface = new ethers.Interface([
      "function postJobMeta(address user, string memory orgName, string memory title, string memory description, string memory orgEmail, string memory logoCID, string[] memory fieldName, bool[] memory isRequired, uint8 jobType, uint8 workMode, string memory minimumSalary, string memory maximumSalary, uint256 expirationDays, bytes memory signature)",
    ]);

    const callData = paymasterInterface.encodeFunctionData("postJobMeta", [
      userAddress,
      job.orgName,
      job.title,
      job.description,
      job.orgEmail,
      job.logoCID,
      job.fieldName || [],
      job.isRequired || [],
      job.jobType,
      job.workMode,
      job.minimumSalary || "",
      job.maximumSalary || "",
      job.expirationDays,
      paymasterSignature,
    ]);

    // Step 3: Create relayer signature
    const relayerAddress = address.JobBoardRelayer;
    if (!relayerAddress) {
      throw new Error("Relayer contract not deployed. Please deploy the relayer contract first.");
    }

    const relayerNonce = await getRelayerNonce(userAddress);
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    const relayerDomain = {
      name: RELAYER_DOMAIN_NAME,
      version: RELAYER_DOMAIN_VERSION,
      chainId: chainId.toString(),
      verifyingContract: relayerAddress,
    };

    const relayerTypes = {
      RelayRequest: [
        { name: "user", type: "address" },
        { name: "data", type: "bytes" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const relayerValue = {
      user: userAddress,
      data: callData,
      nonce: relayerNonce.toString(),
      deadline: deadline.toString(),
    };

    const relayerSignature = await signer.signTypedData(
      relayerDomain,
      relayerTypes,
      relayerValue
    );

    // Step 4: Send to relayer API
    const response = await fetch("/api/relay/post-job", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userAddress,
        callData,
        deadline,
        relayerSignature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to relay transaction");
    }

    return data;
  } catch (error) {
    console.error("Error posting job via relayer:", error);
    reportError(error);
    throw error;
  }
};

const submitApplicationMeta = async (
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
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }

  try {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    const chainId = await getChainId();

    // Step 1: Create paymaster signature
    const paymasterSignature = await createSubmitApplicationSignature(
      userAddress,
      jobId,
      name,
      email,
      phoneNumber,
      location,
      cvCID
    );

    // Step 2: Encode function call to paymaster
    const paymasterAddress = address.JobBoardPaymaster;
    const paymasterInterface = new ethers.Interface([
      "function submitApplicationMeta(address user, uint256 jobId, string memory name, string memory email, string memory phoneNumber, string memory location, string[] memory fieldResponses, string memory cvCID, string memory portfolioLink, string memory experience, string memory expectedSalary, string memory github, bytes memory signature)",
    ]);

    const callData = paymasterInterface.encodeFunctionData("submitApplicationMeta", [
      userAddress,
      jobId,
      name,
      email,
      phoneNumber,
      location,
      fieldResponses || [],
      cvCID,
      portfolioLink || "",
      experience || "",
      expectedSalary || "",
      github || "",
      paymasterSignature,
    ]);

    // Step 3: Create relayer signature
    const relayerAddress = address.JobBoardRelayer;
    if (!relayerAddress) {
      throw new Error("Relayer contract not deployed. Please deploy the relayer contract first.");
    }

    const relayerNonce = await getRelayerNonce(userAddress);
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    const relayerDomain = {
      name: RELAYER_DOMAIN_NAME,
      version: RELAYER_DOMAIN_VERSION,
      chainId: chainId.toString(),
      verifyingContract: relayerAddress,
    };

    const relayerTypes = {
      RelayRequest: [
        { name: "user", type: "address" },
        { name: "data", type: "bytes" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const relayerValue = {
      user: userAddress,
      data: callData,
      nonce: relayerNonce.toString(),
      deadline: deadline.toString(),
    };

    const relayerSignature = await signer.signTypedData(
      relayerDomain,
      relayerTypes,
      relayerValue
    );

    // Step 4: Send to relayer API
    const response = await fetch("/api/relay/submit-application", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userAddress,
        callData,
        deadline,
        relayerSignature,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to relay transaction");
    }

    return data;
  } catch (error) {
    console.error("Error submitting application via relayer:", error);
    reportError(error);
    throw error;
  }
};

const sponsorTransaction = async (
  userAddress: string,
  amount: string
): Promise<any> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }

  try {
    const paymaster = await getPaymasterContract();
    const tx = await paymaster.sponsorTransaction(userAddress, {
      value: toWei(parseFloat(amount)),
    });
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Error sponsoring transaction:", error);
    reportError(error);
    throw error;
  }
};

const setSponsorWhitelist = async (
  sponsorAddress: string,
  whitelisted: boolean
): Promise<any> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }

  try {
    const paymaster = await getPaymasterContract();
    const tx = await paymaster.setSponsorWhitelist(sponsorAddress, whitelisted);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Error setting sponsor whitelist:", error);
    reportError(error);
    throw error;
  }
};

const setPaymasterEnabled = async (enabled: boolean): Promise<any> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }

  try {
    const paymaster = await getPaymasterContract();
    const tx = await paymaster.setPaymasterEnabled(enabled);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Error setting paymaster enabled:", error);
    reportError(error);
    throw error;
  }
};


const depositToPaymaster = async (amount: string): Promise<any> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }

  try {
    const paymaster = await getPaymasterContract();
    const tx = await paymaster.deposit({ value: toWei(parseFloat(amount)) });
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Error depositing to paymaster:", error);
    reportError(error);
    throw error;
  }
};

const withdrawFromPaymaster = async (amount: string): Promise<any> => {
  if (!ethereum) {
    return Promise.reject(
      new Error("Please install MetaMask to use this application.")
    );
  }

  try {
    const paymaster = await getPaymasterContract();
    const tx = await paymaster.withdraw(toWei(parseFloat(amount)));
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error("Error withdrawing from paymaster:", error);
    reportError(error);
    throw error;
  }
};

const getPaymasterBalance = async (): Promise<string> => {
  try {
    const paymaster = getReadOnlyPaymasterContract();
    const balance = await paymaster.getBalance();
    return fromWei(balance);
  } catch (error) {
    console.error("Error getting paymaster balance:", error);
    throw error;
  }
};

const getSponsorGasSpent = async (sponsorAddress: string): Promise<string> => {
  try {
    const paymaster = getReadOnlyPaymasterContract();
    const gasSpent = await paymaster.getSponsorGasSpent(sponsorAddress);
    return gasSpent.toString();
  } catch (error) {
    console.error("Error getting sponsor gas spent:", error);
    throw error;
  }
};

const isSponsorWhitelisted = async (
  sponsorAddress: string
): Promise<boolean> => {
  try {
    const paymaster = getReadOnlyPaymasterContract();
    const whitelisted = await paymaster.whitelistedSponsors(sponsorAddress);
    return whitelisted;
  } catch (error) {
    console.error("Error checking sponsor whitelist:", error);
    throw error;
  }
};

const getPaymasterEnabled = async (): Promise<boolean> => {
  try {
    const paymaster = getReadOnlyPaymasterContract();
    const enabled = await paymaster.paymasterEnabled();
    return enabled;
  } catch (error) {
    console.error("Error getting paymaster enabled status:", error);
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
  grantEmployerRole,
  postJobMeta,
  submitApplicationMeta,
  sponsorTransaction,
  getPaymasterNonce,
  setSponsorWhitelist,
  setPaymasterEnabled,
  depositToPaymaster,
  withdrawFromPaymaster,
  getPaymasterBalance,
  getSponsorGasSpent,
  isSponsorWhitelisted,
  getPaymasterEnabled,
  createPostJobSignature,
  createSubmitApplicationSignature,
};
