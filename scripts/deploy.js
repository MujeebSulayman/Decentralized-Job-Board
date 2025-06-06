const { ethers } = require("hardhat");
const hre = require("hardhat");

/**
 * @dev This script is used to deploy the JobBoard contract to the Sepolia testnet.
 */
async function main() {
  console.log("Deploying JobBoard to sepolia testnet...");

  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    console.log(
      "Account balance:",
      (await ethers.provider.getBalance(deployer.address)).toString()
    );
    const JobBoard = await ethers.getContractFactory("JobBoard");

    console.log("Deploying JobBoard...");

    const jobboard = await JobBoard.deploy(hre.ethers.parseEther("0.01"));
    await jobboard.waitForDeployment();

    console.log("JobBoard deployed at:", await jobboard.getAddress());

    const fs = require("fs");
    const contractsDir = __dirname + "/../contracts";

    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir);
    }

    fs.writeFileSync(
      contractsDir + "/contractAddress.json",
      JSON.stringify({ JobBoard: await jobboard.getAddress() }, undefined, 2)
    );

    console.log("Contract address saved to contractAddress.json");
  } catch (error) {
    console.error("Error deploying JobBoard:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
