const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
	const network = await ethers.provider.getNetwork();
	console.log(
		`Funding paymaster on ${network.name} (chainId: ${network.chainId})...\n`
	);

	const contractsDir = path.join(__dirname, '../contracts');
	const contractAddressFile = path.join(contractsDir, 'contractAddress.json');

	if (!fs.existsSync(contractAddressFile)) {
		console.error('ERROR: contractAddress.json not found');
		process.exit(1);
	}

	const addresses = JSON.parse(fs.readFileSync(contractAddressFile, 'utf8'));
	const paymasterAddress = addresses.JobBoardPaymaster;

	if (!paymasterAddress) {
		console.error('ERROR: Paymaster address not found');
		process.exit(1);
	}

	const [deployer] = await ethers.getSigners();
	console.log('Deployer:', deployer.address);
	const deployerBalance = await ethers.provider.getBalance(deployer.address);
	console.log(
		'Deployer balance:',
		ethers.formatEther(deployerBalance),
		'ETH\n'
	);

	console.log('Paymaster address:', paymasterAddress);
	const currentBalance = await ethers.provider.getBalance(paymasterAddress);
	console.log(
		'Current paymaster balance:',
		ethers.formatEther(currentBalance),
		'ETH\n'
	);

	const amount = process.argv[2] || '0.1';
	const amountWei = ethers.parseEther(amount);

	if (deployerBalance < amountWei) {
		console.error(
			`ERROR: Insufficient balance. Need ${amount} ETH, have ${ethers.formatEther(deployerBalance)} ETH`
		);
		process.exit(1);
	}

	console.log(`Sending ${amount} ETH to paymaster...`);
	const tx = await deployer.sendTransaction({
		to: paymasterAddress,
		value: amountWei,
	});
	await tx.wait();

	const newBalance = await ethers.provider.getBalance(paymasterAddress);
	console.log(
		'\n✅ Paymaster funded!'
	);
	console.log(
		'New balance:',
		ethers.formatEther(newBalance),
		'ETH'
	);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
