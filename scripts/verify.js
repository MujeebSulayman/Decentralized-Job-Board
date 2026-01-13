const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

/**
 * @dev This script verifies deployed contracts on BaseScan (Base network explorer)
 */
async function main() {
	const network = await hre.ethers.provider.getNetwork();
	console.log(`Verifying contracts on ${network.name} (chainId: ${network.chainId})...\n`);

	// Load contract addresses
	const contractsDir = path.join(__dirname, '../contracts');
	const contractAddressFile = path.join(contractsDir, 'contractAddress.json');

	if (!fs.existsSync(contractAddressFile)) {
		console.error('❌ contractAddress.json not found. Please deploy contracts first.');
		process.exit(1);
	}

	const addresses = JSON.parse(fs.readFileSync(contractAddressFile, 'utf8'));

	if (!addresses.JobBoard || !addresses.JobBoardPaymaster) {
		console.error('❌ Contract addresses not found in contractAddress.json');
		process.exit(1);
	}

	const jobBoardAddress = addresses.JobBoard;
	const paymasterAddress = addresses.JobBoardPaymaster;

	console.log('Contract addresses:');
	console.log('  JobBoard:', jobBoardAddress);
	console.log('  JobBoardPaymaster:', paymasterAddress);
	console.log('');

	// Check for API key
	if (!process.env.BASESCAN_API_KEY && !process.env.ETHERSCAN_API_KEY) {
		console.error('❌ BASESCAN_API_KEY or ETHERSCAN_API_KEY not set in .env file');
		console.log('\nGet your API key from: https://basescan.org/apis');
		process.exit(1);
	}

	// Verify JobBoard
	console.log('Verifying JobBoard...');
	try {
		await hre.run('verify:verify', {
			address: jobBoardAddress,
			constructorArguments: [hre.ethers.parseEther('0.01')],
		});
		console.log('✓ JobBoard verified successfully\n');
	} catch (error) {
		const errorMsg = error.message || error.toString();
		if (errorMsg.includes('Already Verified') || errorMsg.includes('already verified')) {
			console.log('✓ JobBoard already verified\n');
		} else {
			console.error('❌ JobBoard verification failed:', errorMsg);
			console.log('');
		}
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
		if (errorMsg.includes('Already Verified') || errorMsg.includes('already verified')) {
			console.log('✓ JobBoardPaymaster already verified\n');
		} else {
			console.error('❌ JobBoardPaymaster verification failed:', errorMsg);
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
	console.log(`JobBoard: ${explorerUrl}/address/${jobBoardAddress}`);
	console.log(`Paymaster: ${explorerUrl}/address/${paymasterAddress}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
