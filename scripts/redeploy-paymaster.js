const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
	const network = await ethers.provider.getNetwork();
	console.log(
		`Redeploying JobBoardPaymaster on ${network.name} (chainId: ${network.chainId})...\n`
	);

	try {
		const [deployer] = await ethers.getSigners();

		if (!deployer) {
			throw new Error(
				'No deployer account found. Please set PRIVATE_KEY in .env file'
			);
		}

		console.log('Deploying with account:', deployer.address);
		console.log(
			'Account balance:',
			ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
			'ETH\n'
		);

		// Load existing contract addresses
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

		if (!proxyAddress) {
			console.error(
				'ERROR: JobBoardProxy address not found in contractAddress.json'
			);
			process.exit(1);
		}

		console.log('JobBoard Proxy address:', proxyAddress);
		console.log('Deploying new JobBoardPaymaster...\n');

		// Deploy Paymaster with retry logic
		const JobBoardPaymaster = await ethers.getContractFactory(
			'JobBoardPaymaster'
		);

		let paymaster;
		let paymasterAddress;
		const maxRetries = 3;
		let retryCount = 0;

		while (retryCount < maxRetries) {
			try {
				console.log(`Deployment attempt ${retryCount + 1}/${maxRetries}...`);
				paymaster = await JobBoardPaymaster.deploy(
					proxyAddress,
					'HemBoard',
					'1'
				);
				await paymaster.waitForDeployment();
				paymasterAddress = await paymaster.getAddress();
				break;
			} catch (error) {
				retryCount++;
				if (retryCount >= maxRetries) {
					throw error;
				}
				console.log(
					`Deployment failed, retrying in 5 seconds... (${retryCount}/${maxRetries})`
				);
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		}

		console.log('New Paymaster deployed at:', paymasterAddress, '\n');

		// Connect to JobBoard contract and set the paymaster
		console.log('Registering paymaster in JobBoard contract...');
		const JobBoardUpgradeable = await ethers.getContractFactory(
			'JobBoardUpgradeable'
		);
		const jobBoard = JobBoardUpgradeable.attach(proxyAddress);

		// Verify deployer is owner
		const owner = await jobBoard.owner();
		if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
			console.warn(
				'WARNING: Deployer is not the owner. Cannot set paymaster automatically.'
			);
			console.warn('  Owner:', owner);
			console.warn('  Deployer:', deployer.address);
			console.warn(
				'  Please call setPaymaster() manually with the owner account.'
			);
		} else {
			try {
				const setPaymasterTx = await jobBoard.setPaymaster(
					paymasterAddress,
					true
				);
				await setPaymasterTx.wait();
				console.log('Paymaster registered and enabled in JobBoard contract\n');
			} catch (error) {
				console.error('Error setting paymaster in JobBoard:', error.message);
				console.warn(
					'Please set the paymaster manually by calling setPaymaster()'
				);
			}
		}

		// Update contract addresses file
		addresses.JobBoardPaymaster = paymasterAddress;
		fs.writeFileSync(
			contractAddressFile,
			JSON.stringify(addresses, undefined, 2)
		);

		console.log('Contract addresses updated in contractAddress.json');
		console.log('\n=== Redeployment Summary ===');
		console.log('Network:', network.name, `(Chain ID: ${network.chainId})`);
		console.log('Deployer:', deployer.address);
		console.log('New Paymaster:', paymasterAddress);
		console.log('\nIMPORTANT:');
		console.log('  - Update your frontend to use the new paymaster address');
		console.log('  - The old paymaster is still deployed but no longer used');
	} catch (error) {
		console.error('Error redeploying paymaster:', error.message);
		throw error;
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
