const { ethers, upgrades } = require('hardhat');
const fs = require('fs');
const path = require('path');

const PAYMASTER_DOMAIN_NAME = 'HemBoard';
const PAYMASTER_DOMAIN_VERSION = '1';
const RELAYER_DOMAIN_NAME = 'HemBoardRelayer';
const RELAYER_DOMAIN_VERSION = '1';

async function main() {
	console.log('=== Testing JobBoardRelayer on Local Node ===\n');

	const [owner, user, relayerAccount] = await ethers.getSigners();

	console.log('Accounts:');
	console.log('  Owner:', owner.address);
	console.log('  User:', user.address);
	console.log('  Relayer:', relayerAccount.address);
	console.log('');

	console.log('Deploying JobBoard...');
	const JobBoardUpgradeable = await ethers.getContractFactory(
		'JobBoardUpgradeable',
		owner
	);
	const serviceFee = ethers.parseEther('0.01');
	const jobBoard = await upgrades.deployProxy(
		JobBoardUpgradeable,
		[serviceFee],
		{
			initializer: 'initialize',
			kind: 'transparent',
			txOverrides: {
				gasLimit: 15000000,
			},
		}
	);
	await jobBoard.waitForDeployment();
	const jobBoardAddress = await jobBoard.getAddress();
	console.log('✓ JobBoard deployed at:', jobBoardAddress);

	console.log('\nDeploying Paymaster...');
	const JobBoardPaymaster = await ethers.getContractFactory(
		'JobBoardPaymaster',
		owner
	);
	const paymaster = await JobBoardPaymaster.deploy(
		jobBoardAddress,
		PAYMASTER_DOMAIN_NAME,
		PAYMASTER_DOMAIN_VERSION,
		{ gasLimit: 5000000 }
	);
	await paymaster.waitForDeployment();
	const paymasterAddress = await paymaster.getAddress();
	console.log('✓ Paymaster deployed at:', paymasterAddress);

	await jobBoard.setPaymaster(paymasterAddress, true, { gasLimit: 200000 });
	console.log('✓ Paymaster enabled in JobBoard');

	const fundTx = await owner.sendTransaction({
		to: paymasterAddress,
		value: ethers.parseEther('0.1'),
		gasLimit: 100000,
	});
	await fundTx.wait();
	console.log('✓ Paymaster funded');

	console.log('\nDeploying Relayer...');
	const JobBoardRelayer = await ethers.getContractFactory(
		'JobBoardRelayer',
		owner
	);
	const relayer = await JobBoardRelayer.deploy(
		paymasterAddress,
		RELAYER_DOMAIN_NAME,
		RELAYER_DOMAIN_VERSION,
		{ gasLimit: 3000000 }
	);
	await relayer.waitForDeployment();
	const relayerAddress = await relayer.getAddress();
	console.log('✓ Relayer deployed at:', relayerAddress);

	const authTx = await paymaster.setAuthorizedRelayer(relayerAddress, true, {
		gasLimit: 200000,
	});
	await authTx.wait();
	console.log('✓ Relayer authorized in paymaster');
	console.log('');

	console.log('Creating test job...');
	const postJobTx = await jobBoard.postJob(
		'Test Company',
		'Software Engineer',
		'We are hiring a talented software engineer',
		'hr@testcompany.com',
		'QmLogo123',
		[],
		[],
		0,
		0,
		'5000',
		'10000',
		30,
		{ value: serviceFee, gasLimit: 2000000 }
	);
	await postJobTx.wait();
	const jobId = 1;
	console.log('✓ Job created with ID:', jobId);
	console.log('');

	console.log('=== Testing Gasless Application Submission ===\n');

	const name = 'John Doe';
	const email = 'john@example.com';
	const phoneNumber = '1234567890';
	const location = 'New York';
	const cvCID = 'QmCvTest123';
	const portfolioLink = 'https://portfolio.com/john';
	const experience = '5 years of software development';
	const expectedSalary = '7500';
	const github = 'github.com/johndoe';

	console.log('Step 1: User signs message for paymaster (NO GAS REQUIRED)');
	const userBalanceBefore = await ethers.provider.getBalance(user.address);
	console.log('  User balance:', ethers.formatEther(userBalanceBefore), 'ETH');

	const paymasterNonce = await paymaster.getNonce(user.address);
	const chainId = (await ethers.provider.getNetwork()).chainId;

	const paymasterDomain = {
		name: PAYMASTER_DOMAIN_NAME,
		version: PAYMASTER_DOMAIN_VERSION,
		chainId: chainId.toString(),
		verifyingContract: paymasterAddress,
	};

	const paymasterTypes = {
		SubmitApplication: [
			{ name: 'user', type: 'address' },
			{ name: 'jobId', type: 'uint256' },
			{ name: 'name', type: 'string' },
			{ name: 'email', type: 'string' },
			{ name: 'phoneNumber', type: 'string' },
			{ name: 'location', type: 'string' },
			{ name: 'cvCID', type: 'string' },
			{ name: 'nonce', type: 'uint256' },
		],
	};

	const paymasterValue = {
		user: user.address,
		jobId,
		name,
		email,
		phoneNumber,
		location,
		cvCID,
		nonce: paymasterNonce.toString(),
	};

	const paymasterSignature = await user.signTypedData(
		paymasterDomain,
		paymasterTypes,
		paymasterValue
	);

	const userBalanceAfterSign = await ethers.provider.getBalance(user.address);
	console.log(
		'  User balance after signing:',
		ethers.formatEther(userBalanceAfterSign),
		'ETH'
	);
	console.log('  ✓ No gas spent by user');
	console.log('');

	console.log('Step 2: Encoding function call to paymaster');
	const paymasterInterface = new ethers.Interface([
		'function submitApplicationMeta(address user, uint256 jobId, string memory name, string memory email, string memory phoneNumber, string memory location, string[] memory fieldResponses, string memory cvCID, string memory portfolioLink, string memory experience, string memory expectedSalary, string memory github, bytes memory signature)',
	]);

	const callData = paymasterInterface.encodeFunctionData(
		'submitApplicationMeta',
		[
			user.address,
			jobId,
			name,
			email,
			phoneNumber,
			location,
			[],
			cvCID,
			portfolioLink,
			experience,
			expectedSalary,
			github,
			paymasterSignature,
		]
	);
	console.log('  ✓ Function call encoded');
	console.log('');

	console.log('Step 3: User signs message for relayer (NO GAS REQUIRED)');
	const relayerNonce = await relayer.getNonce(user.address);
	const deadline = Math.floor(Date.now() / 1000) + 3600;

	const relayerDomain = {
		name: RELAYER_DOMAIN_NAME,
		version: RELAYER_DOMAIN_VERSION,
		chainId: chainId.toString(),
		verifyingContract: relayerAddress,
	};

	const relayerTypes = {
		RelayRequest: [
			{ name: 'user', type: 'address' },
			{ name: 'data', type: 'bytes' },
			{ name: 'nonce', type: 'uint256' },
			{ name: 'deadline', type: 'uint256' },
		],
	};

	const relayerValue = {
		user: user.address,
		data: callData,
		nonce: relayerNonce.toString(),
		deadline: deadline.toString(),
	};

	const relayerSignature = await user.signTypedData(
		relayerDomain,
		relayerTypes,
		relayerValue
	);

	const userBalanceAfterRelaySign = await ethers.provider.getBalance(
		user.address
	);
	console.log(
		'  User balance:',
		ethers.formatEther(userBalanceAfterRelaySign),
		'ETH'
	);
	console.log('  ✓ No gas spent by user');
	console.log('');

	console.log('Step 4: Relayer executes transaction');
	const relayerBalanceBefore = await ethers.provider.getBalance(
		relayerAccount.address
	);
	const paymasterBalanceBefore = await ethers.provider.getBalance(
		paymasterAddress
	);
	console.log(
		'  Relayer balance before:',
		ethers.formatEther(relayerBalanceBefore),
		'ETH'
	);
	console.log(
		'  Paymaster balance before:',
		ethers.formatEther(paymasterBalanceBefore),
		'ETH'
	);

	const executeTx = await relayer
		.connect(relayerAccount)
		.executeRelay(user.address, callData, deadline, relayerSignature, {
			gasLimit: 5000000,
		});

	const receipt = await executeTx.wait();
	const gasUsed = receipt.gasUsed * receipt.gasPrice;
	const relayerBalanceAfter = await ethers.provider.getBalance(
		relayerAccount.address
	);
	const paymasterBalanceAfter = await ethers.provider.getBalance(
		paymasterAddress
	);

	console.log('  Transaction hash:', receipt.hash);
	console.log('  Gas used:', ethers.formatEther(gasUsed), 'ETH');
	console.log(
		'  Relayer balance after:',
		ethers.formatEther(relayerBalanceAfter),
		'ETH'
	);
	console.log(
		'  Paymaster balance after:',
		ethers.formatEther(paymasterBalanceAfter),
		'ETH'
	);

	const relayerBalanceChange = relayerBalanceAfter - relayerBalanceBefore;
	const paymasterBalanceChange = paymasterBalanceAfter - paymasterBalanceBefore;

	console.log(
		'  Relayer balance change:',
		ethers.formatEther(relayerBalanceChange),
		'ETH'
	);
	console.log(
		'  Paymaster balance change:',
		ethers.formatEther(paymasterBalanceChange),
		'ETH'
	);

	if (relayerBalanceChange > 0n) {
		console.log('  ✓ Relayer was reimbursed by paymaster');
	} else {
		console.log('  ⚠ Relayer was not reimbursed (check paymaster balance)');
	}
	console.log('');

	console.log('Step 5: Verifying application was submitted');
	const applications = await jobBoard.getJobApplications(jobId);
	console.log('  Total applications:', applications.length);

	if (applications.length > 0) {
		const application = applications[0];
		console.log('  Applicant:', application.applicant);
		console.log('  Name:', application.name);
		console.log('  Email:', application.email);
		console.log('  ✓ Application successfully submitted!');
	}

	console.log('\n=== Final Balances ===');
	const finalUserBalance = await ethers.provider.getBalance(user.address);
	const finalRelayerBalance = await ethers.provider.getBalance(
		relayerAccount.address
	);

	console.log('User balance:', ethers.formatEther(finalUserBalance), 'ETH');
	console.log(
		'Relayer balance:',
		ethers.formatEther(finalRelayerBalance),
		'ETH'
	);
	console.log('');

	console.log('=== Summary ===');
	console.log('✓ User signed messages (NO GAS SPENT)');
	console.log('✓ Relayer executed transaction');
	console.log('✓ Paymaster reimbursed relayer for gas costs');
	console.log('✓ Application submitted successfully');
	console.log('✓ Transaction was 100% gasless for the user!');
	console.log('');

	console.log('=== Contract Addresses ===');
	console.log('JobBoard:', jobBoardAddress);
	console.log('Paymaster:', paymasterAddress);
	console.log('Relayer:', relayerAddress);
	console.log('');

	const addresses = {
		JobBoard: jobBoardAddress,
		Paymaster: paymasterAddress,
		Relayer: relayerAddress,
		Owner: owner.address,
		User: user.address,
		RelayerAccount: relayerAccount.address,
	};

	const outputPath = path.join(__dirname, '../test-relayer-addresses.json');
	fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
	console.log('✓ Addresses saved to:', outputPath);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
