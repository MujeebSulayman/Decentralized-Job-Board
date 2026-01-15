const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

/**
 * @dev This script verifies deployed contracts on BaseScan (Base network explorer)
 */
async function main() {
	const network = await hre.ethers.provider.getNetwork();
	console.log(
		`Verifying contracts on ${network.name} (chainId: ${network.chainId})...\n`
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

	const jobBoardAddress = addresses.JobBoardProxy || addresses.JobBoard;
	const paymasterAddress = addresses.JobBoardPaymaster;

	if (!jobBoardAddress || !paymasterAddress) {
		console.error(
			'ERROR: Contract addresses not found in contractAddress.json'
		);
		console.error('Expected JobBoardProxy (or JobBoard) and JobBoardPaymaster');
		process.exit(1);
	}

	console.log('Contract addresses:');
	console.log('  JobBoard:', jobBoardAddress);
	console.log('  JobBoardPaymaster:', paymasterAddress);
	console.log('');

	// Check for API key
	if (!process.env.BASESCAN_API_KEY && !process.env.ETHERSCAN_API_KEY) {
		console.error(
			'ERROR: BASESCAN_API_KEY or ETHERSCAN_API_KEY not set in .env file'
		);
		console.log('\nGet your API key from: https://basescan.org/apis');
		process.exit(1);
	}

	// Verify JobBoard Implementation
	const implementationAddress = addresses.JobBoardImplementation;
	if (implementationAddress) {
		console.log('Verifying JobBoard Implementation...');
		try {
			await hre.run('verify:verify', {
				address: implementationAddress,
				constructorArguments: [], // Empty constructor for upgradeable contracts
			});
			console.log('✓ JobBoard Implementation verified successfully\n');
		} catch (error) {
			const errorMsg = error.message || error.toString();
			if (
				errorMsg.includes('Already Verified') ||
				errorMsg.includes('already verified')
			) {
				console.log('✓ JobBoard Implementation already verified\n');
			} else {
				console.error(
					'✗ JobBoard Implementation verification failed:',
					errorMsg
				);
				console.log('');
			}
		}
	} else {
		console.warn(
			'WARNING: JobBoardImplementation address not found, skipping verification\n'
		);
	}

	// Verify JobBoardPaymaster
	console.log('Verifying JobBoardPaymaster...');
	try {
		await hre.run('verify:verify', {
			address: paymasterAddress,
			constructorArguments: [jobBoardAddress, 'HemBoard', '1'],
		});
		console.log('✓ JobBoardPaymaster verified successfully\n');
	} catch (error) {
		const errorMsg = error.message || error.toString();
		if (
			errorMsg.includes('Already Verified') ||
			errorMsg.includes('already verified')
		) {
			console.log('✓ JobBoardPaymaster already verified\n');
		} else {
			console.error('✗ JobBoardPaymaster verification failed:', errorMsg);
			console.log('');
		}
	}

	console.log('=== Verification Summary ===');
	const explorerUrl =
		network.chainId === 8453n
			? 'https://basescan.org'
			: network.chainId === 84532n
			? 'https://sepolia.basescan.org'
			: 'https://basescan.org';
	console.log(`JobBoard Proxy: ${explorerUrl}/address/${jobBoardAddress}`);
	if (implementationAddress) {
		console.log(
			`JobBoard Implementation: ${explorerUrl}/address/${implementationAddress}`
		);
	}
	console.log(`Paymaster: ${explorerUrl}/address/${paymasterAddress}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
