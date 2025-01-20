import address from "../contracts/contractAddress.json";
import abi from "../artifacts/contracts/JobBoard.sol/JobBoard.json";
import { ethers } from "ethers";
import { error } from "console";

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

const postJob = async () => {
  if (!ethereum) {
    reportError("Please install a wallet provider");
    return Promise.reject(new Error("Browser Provider not found"));
  }
  
};

export { updateServiceFee, grantEmployerRole };
