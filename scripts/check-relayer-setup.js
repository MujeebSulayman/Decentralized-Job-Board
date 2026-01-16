const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log(`Checking relayer setup on ${network.name} (chainId: ${network.chainId})...\n`);

  const [deployer] = await ethers.getSigners();
  console.log('Using account:', deployer.address);
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH\n');

  const contractsDir = path.join(__dirname, '../contracts');
  const contractAddressFile = path.join(contractsDir, 'contractAddress.json');

  if (!fs.existsSync(contractAddressFile)) {
    console.error('ERROR: contractAddress.json not found');
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(contractAddressFile, 'utf8'));
  const proxyAddress = addresses.JobBoardProxy;
  const paymasterAddress = addresses.JobBoardPaymaster;
  const relayerAddress = addresses.JobBoardRelayer;

  if (!proxyAddress || !paymasterAddress || !relayerAddress) {
    console.error('ERROR: Missing contract addresses in contractAddress.json');
    process.exit(1);
  }

  console.log('Contract Addresses:');
  console.log('  JobBoard Proxy:', proxyAddress);
  console.log('  Paymaster:', paymasterAddress);
  console.log('  Relayer:', relayerAddress);
  console.log('');

  const JobBoardUpgradeable = await ethers.getContractFactory('JobBoardUpgradeable');
  const jobBoard = JobBoardUpgradeable.attach(proxyAddress);

  const JobBoardPaymaster = await ethers.getContractFactory('JobBoardPaymaster');
  const paymaster = JobBoardPaymaster.attach(paymasterAddress);

  const JobBoardRelayer = await ethers.getContractFactory('JobBoardRelayer');
  const relayer = JobBoardRelayer.attach(relayerAddress);

  console.log('Checking JobBoard:');
  const jobBoardPaymaster = await jobBoard.paymaster();
  const jobBoardPaymasterEnabled = await jobBoard.paymasterEnabled();
  console.log('  Registered paymaster:', jobBoardPaymaster);
  console.log('  Paymaster enabled:', jobBoardPaymasterEnabled);
  console.log('  Paymaster matches:', jobBoardPaymaster.toLowerCase() === paymasterAddress.toLowerCase());
  console.log('');

  console.log('Checking Paymaster:');
  const paymasterEnabled = await paymaster.paymasterEnabled();
  const paymasterBalance = await ethers.provider.getBalance(paymasterAddress);
  const isRelayerAuthorized = await paymaster.authorizedRelayers(relayerAddress);
  console.log('  Paymaster enabled:', paymasterEnabled);
  console.log('  Paymaster balance:', ethers.formatEther(paymasterBalance), 'ETH');
  console.log('  Relayer authorized:', isRelayerAuthorized);
  console.log('');

  console.log('Checking Relayer:');
  const relayerPaymaster = await relayer.paymaster();
  console.log('  Relayer paymaster:', relayerPaymaster);
  console.log('  Paymaster matches:', relayerPaymaster.toLowerCase() === paymasterAddress.toLowerCase());
  console.log('');

  if (jobBoardPaymaster.toLowerCase() !== paymasterAddress.toLowerCase() || !jobBoardPaymasterEnabled) {
    console.error('❌ ISSUE: Paymaster is not properly registered in JobBoard!');
    console.error('   Run: npx hardhat run scripts/set-paymaster.js --network', network.name);
  } else {
    console.log('✓ Paymaster is registered in JobBoard');
  }

  if (!isRelayerAuthorized) {
    console.error('❌ ISSUE: Relayer is not authorized in Paymaster!');
    console.error('   Run: npx hardhat run scripts/deploy-relayer.js --network', network.name);
  } else {
    console.log('✓ Relayer is authorized in Paymaster');
  }

  if (paymasterBalance === 0n) {
    console.warn('⚠️  WARNING: Paymaster has no balance!');
  } else {
    console.log('✓ Paymaster has balance');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
