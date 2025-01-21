import address from "../contracts/contractAddress.json";
import abi from "../artifacts/contracts/JobBoard.sol/JobBoard.json";
import { ethers } from "ethers";
import { JobPostParams } from "@/utils/type.dt";

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
    tx = await contract._grantEmployerRole(roleAddress);
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
    const contract = await getEthereumContract();
    tx = await contract.postJob(
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
      job.expirationDays
    );
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
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

export { updateServiceFee, grantEmployerRole, postJob, editJob };
