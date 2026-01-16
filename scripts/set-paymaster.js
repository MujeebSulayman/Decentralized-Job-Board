const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
	const network = await ethers.provider.getNetwork();
	console.log(
		`Setting paymaster in JobBoard on ${network.name} (chainId: ${network.chainId})...\n`
	);

	try {
		const [deployer] = await ethers.getSigners();

		if (!deployer) {
			throw new Error(
				'No deployer account found. Please set PRIVATE_KEY in .env file'
			);
		}

		console.log('Using account:', deployer.address);
		console.log(
			'Account balance:',
			ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
			'ETH\n'
		);

		// Load contract addresses
		const contractsDir = path.join(__dirname, '../contracts');
		const contractAddressFile = path.join(contractsDir, 'contractAddress.json');

		if (!fs.existsSync(contractAddressFile)) {
			console.error(
				'ERROR: contractAddress.json not found. Please deploy contracts first.'
			);
			process.exit(1);
		}

		const addresses = JSON.parse(fs.readFileSync(contractAddressFile, 'utf8'));
		const proxyAddress = addresses.JobBoardProxy;
		const paymasterAddress = addresses.JobBoardPaymaster;

		if (!proxyAddress) {
			console.error(
				'ERROR: JobBoardProxy address not found in contractAddress.json'
			);
			process.exit(1);
		}

		if (!paymasterAddress) {
			console.error(
				'ERROR: JobBoardPaymaster address not found in contractAddress.json'
			);
			process.exit(1);
		}

		console.log('JobBoard Proxy address:', proxyAddress);
		console.log('Paymaster address:', paymasterAddress, '\n');

		// Connect to JobBoard contract
		const JobBoardUpgradeable = await ethers.getContractFactory(
			'JobBoardUpgradeable'
		);
		const jobBoard = JobBoardUpgradeable.attach(proxyAddress);

		// Verify deployer is owner
		const owner = await jobBoard.owner();
		console.log('JobBoard owner:', owner);
		console.log('Deployer address:', deployer.address);

		if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
			console.error(
				'ERROR: Deployer is not the owner. Only the owner can set the paymaster.'
			);
			process.exit(1);
		}

		// Check current paymaster status
		const currentPaymaster = await jobBoard.paymaster();
		const paymasterEnabled = await jobBoard.paymasterEnabled();
		console.log('Current paymaster:', currentPaymaster);
		console.log('Paymaster enabled:', paymasterEnabled, '\n');

		// Set the paymaster
		console.log('Setting paymaster...');
		const setPaymasterTx = await jobBoard.setPaymaster(paymasterAddress, true);
		await setPaymasterTx.wait();
		console.log('Paymaster set successfully!\n');

		// Verify
		const newPaymaster = await jobBoard.paymaster();
		const newPaymasterEnabled = await jobBoard.paymasterEnabled();
		console.log('Verification:');
		console.log('  Paymaster address:', newPaymaster);
		console.log('  Paymaster enabled:', newPaymasterEnabled);

		if (
			newPaymaster.toLowerCase() === paymasterAddress.toLowerCase() &&
			newPaymasterEnabled
		) {
			console.log('\n✓ Paymaster configured correctly!');
		} else {
			console.error('\n✗ Paymaster configuration failed!');
			process.exit(1);
		}
	} catch (error) {
		console.error('Error setting paymaster:', error.message);
		throw error;
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
