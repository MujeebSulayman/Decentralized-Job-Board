const { ethers } = require("hardhat");


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

    const jobboard = await JobBoard.deploy();
    await jobboard.deployed();

    console.log("JobBoard deployed at:", jobboard.address);

    const fs = require("fs");
    const contractsDir = __dirname + "/../contracts";

    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir);
    }

    fs.writeFileSync(
      contractsDir + "/contractAddress.json",
      JSON.stringify({ JobBoard: jobboard.address }, undefined, 2)
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
