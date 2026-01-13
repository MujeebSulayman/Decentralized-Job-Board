const { ethers } = require('hardhat');
const hre = require('hardhat');

/**
 * @dev This script is used to deploy the JobBoard contract to Base network.
 */
async function main() {
  const network = await ethers.provider.getNetwork();
  console.log(`Deploying JobBoard to ${network.name} (chainId: ${network.chainId})...`);

  try {
    const [deployer] = await ethers.getSigners();
    
    if (!deployer) {
      throw new Error('No deployer account found. Please set PRIVATE_KEY in .env file');
    }
    
    console.log('Deploying contracts with the account:', deployer.address);

    console.log(
      'Account balance:',
      (await ethers.provider.getBalance(deployer.address)).toString()
    );
    const JobBoard = await ethers.getContractFactory('JobBoard');

    console.log('Deploying JobBoard...');

    const jobboard = await JobBoard.deploy(hre.ethers.parseEther('0.01'));
    await jobboard.waitForDeployment();

    const jobBoardAddress = await jobboard.getAddress();
    console.log('JobBoard deployed at:', jobBoardAddress);

    // Deploy Paymaster
    console.log('Deploying JobBoardPaymaster...');
    const JobBoardPaymaster = await ethers.getContractFactory('JobBoardPaymaster');
    
    const paymaster = await JobBoardPaymaster.deploy(
      jobBoardAddress,
      'HemBoard',
      '1'
    );
    await paymaster.waitForDeployment();

    const paymasterAddress = await paymaster.getAddress();
    console.log('JobBoardPaymaster deployed at:', paymasterAddress);

    // Enable paymaster in JobBoard
    console.log('Enabling paymaster in JobBoard...');
    const enableTx = await jobboard.setPaymaster(paymasterAddress, true);
    await enableTx.wait();
    console.log('Paymaster enabled in JobBoard');

    // Wait for block confirmations
    console.log('\nWaiting for block confirmations...');
    const jobBoardTx = jobboard.deploymentTransaction();
    const paymasterTx = paymaster.deploymentTransaction();
    
    if (jobBoardTx) {
      await jobBoardTx.wait(2);
    }
    if (paymasterTx) {
      await paymasterTx.wait(2);
    }

    // Save contract addresses
    const fs = require('fs');
    const contractsDir = __dirname + '/../contracts';

    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir);
    }

    fs.writeFileSync(
      contractsDir + '/contractAddress.json',
      JSON.stringify(
        {
          JobBoard: jobBoardAddress,
          JobBoardPaymaster: paymasterAddress,
        },
        undefined,
        2
      )
    );

    console.log('Contract addresses saved to contractAddress.json');
    console.log('\n=== Deployment Summary ===');
    console.log('Network:', network.name, `(Chain ID: ${network.chainId})`);
    console.log('JobBoard:', jobBoardAddress);
    console.log('Paymaster:', paymasterAddress);
    console.log('\nTo verify contracts, run:');
    console.log(`  npm run verify:${network.name === 'base' ? 'base' : 'base-sepolia'}`);
    console.log('\nTo fund the paymaster, send ETH to:', paymasterAddress);
  } catch (error) {
    console.error('Error deploying JobBoard:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
