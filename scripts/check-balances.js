const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
	const network = await ethers.provider.getNetwork();
	console.log(
		`Checking balances on ${network.name} (chainId: ${network.chainId})...\n`
	);

	const contractsDir = path.join(__dirname, '../contracts');
	const contractAddressFile = path.join(contractsDir, 'contractAddress.json');

	if (!fs.existsSync(contractAddressFile)) {
		console.error('ERROR: contractAddress.json not found');
		process.exit(1);
	}

	const addresses = JSON.parse(fs.readFileSync(contractAddressFile, 'utf8'));
	const paymasterAddress = addresses.JobBoardPaymaster;
	const relayerAddress = addresses.JobBoardRelayer;

	if (!paymasterAddress) {
		console.error('ERROR: Paymaster address not found');
		process.exit(1);
	}

	const [deployer] = await ethers.getSigners();
	console.log('Deployer:', deployer.address);
	console.log('');

	if (process.env.RELAYER_PRIVATE_KEY) {
		const relayerWallet = new ethers.Wallet(
			process.env.RELAYER_PRIVATE_KEY,
			ethers.provider
		);
		const relayerBalance = await ethers.provider.getBalance(
			relayerWallet.address
		);
		console.log('Relayer Wallet:', relayerWallet.address);
		console.log(
			'  Balance:',
			ethers.formatEther(relayerBalance),
			'ETH'
		);
		if (relayerBalance === 0n) {
			console.log('  ⚠️  WARNING: Relayer wallet has no ETH!');
		}
		console.log('');
	} else {
		console.log('⚠️  RELAYER_PRIVATE_KEY not set in .env');
		console.log('');
	}

	console.log('Paymaster Contract:', paymasterAddress);
	const paymasterBalance = await ethers.provider.getBalance(paymasterAddress);
	console.log('  Balance:', ethers.formatEther(paymasterBalance), 'ETH');
	if (paymasterBalance === 0n) {
		console.log('  ⚠️  WARNING: Paymaster has no ETH!');
		console.log('  Fund it to enable gas reimbursements');
	}
	console.log('');

	if (relayerAddress) {
		console.log('Relayer Contract:', relayerAddress);
		const relayerContractBalance = await ethers.provider.getBalance(
			relayerAddress
		);
		console.log(
			'  Balance:',
			ethers.formatEther(relayerContractBalance),
			'ETH'
		);
		console.log('');
	}

	console.log('=== Summary ===');
	if (process.env.RELAYER_PRIVATE_KEY) {
		const relayerWallet = new ethers.Wallet(
			process.env.RELAYER_PRIVATE_KEY,
			ethers.provider
		);
		const relayerBalance = await ethers.provider.getBalance(
			relayerWallet.address
		);
		if (relayerBalance > 0n && paymasterBalance > 0n) {
			console.log('✅ All wallets funded - ready to go!');
		} else {
			console.log('⚠️  Some wallets need funding:');
			if (relayerBalance === 0n) {
				console.log('  - Relayer wallet needs ETH');
			}
			if (paymasterBalance === 0n) {
				console.log('  - Paymaster needs ETH');
			}
		}
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
