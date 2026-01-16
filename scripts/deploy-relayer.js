const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

const RELAYER_DOMAIN_NAME = 'HemBoardRelayer';
const RELAYER_DOMAIN_VERSION = '1';

async function main() {
	const network = await ethers.provider.getNetwork();
	console.log(
		`Deploying JobBoardRelayer on ${network.name} (chainId: ${network.chainId})...\n`
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
		const paymasterAddress = addresses.JobBoardPaymaster;

		if (!paymasterAddress) {
			console.error(
				'ERROR: JobBoardPaymaster address not found in contractAddress.json'
			);
			console.error('Please deploy the paymaster first.');
			process.exit(1);
		}

		console.log('Paymaster address:', paymasterAddress);
		console.log('Deploying JobBoardRelayer...\n');

		// Deploy Relayer
		const JobBoardRelayer = await ethers.getContractFactory('JobBoardRelayer');
		const relayer = await JobBoardRelayer.deploy(
			paymasterAddress,
			RELAYER_DOMAIN_NAME,
			RELAYER_DOMAIN_VERSION
		);
		await relayer.waitForDeployment();
		const relayerAddress = await relayer.getAddress();

		console.log('✓ Relayer deployed at:', relayerAddress);
		console.log('');

		// Authorize the relayer contract in the paymaster
		console.log('Authorizing relayer in paymaster...');
		const paymaster = await ethers.getContractAt(
			'JobBoardPaymaster',
			paymasterAddress,
			deployer
		);
		const authTx = await paymaster.setAuthorizedRelayer(relayerAddress, true);
		await authTx.wait();
		console.log('✓ Relayer authorized in paymaster');
		console.log('');

		// Update contract addresses file
		addresses.JobBoardRelayer = relayerAddress;
		fs.writeFileSync(
			contractAddressFile,
			JSON.stringify(addresses, undefined, 2)
		);

		console.log('Contract addresses updated in contractAddress.json');
		console.log('\n=== Deployment Summary ===');
		console.log('Network:', network.name, `(Chain ID: ${network.chainId})`);
		console.log('Deployer:', deployer.address);
		console.log('Relayer:', relayerAddress);
		console.log('Paymaster:', paymasterAddress);
		console.log('\nIMPORTANT:');
		console.log('  - Make sure to fund the relayer wallet (RELAYER_PRIVATE_KEY)');
		console.log('  - The relayer wallet will pay for all gas fees');
	} catch (error) {
		console.error('Error deploying relayer:', error.message);
		throw error;
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
