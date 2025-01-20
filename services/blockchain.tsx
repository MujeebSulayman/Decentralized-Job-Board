import address from "../contracts/contractAddress.json";
import abi from "../artifacts/contracts/JobBoard.sol/JobBoard.json";
import { ethers } from "ethers";

const toWei = (num: number) => ethers.parseEther(num.toString());

const fromWei = (num: number | string | null): string => {
  if (num == null || num === undefined) {
    return "0";
  }
  return ethers.formatEther(num.toString());
};

let ethereum: any;
let tx: any;
