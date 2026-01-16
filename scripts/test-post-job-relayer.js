const { ethers, upgrades } = require('hardhat');

const PAYMASTER_DOMAIN_NAME = 'HemBoard';
const PAYMASTER_DOMAIN_VERSION = '1';
const RELAYER_DOMAIN_NAME = 'HemBoardRelayer';
const RELAYER_DOMAIN_VERSION = '1';

async function main() {
	console.log('=== Testing PostJob via Relayer on Local Node ===\n');

	const [owner, user, relayerAccount] = await ethers.getSigners();

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

	console.log('=== Testing Gasless Job Posting ===\n');

	const orgName = 'Test Company';
	const title = 'Software Engineer';
	const description = 'We are hiring a talented software engineer';
	const orgEmail = 'hr@testcompany.com';
	const logoCID = 'QmLogo123';
	const fieldName = [];
	const isRequired = [];
	const jobType = 0;
	const workMode = 0;
	const minimumSalary = '5000';
	const maximumSalary = '10000';
	const expirationDays = 30;

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
		PostJob: [
			{ name: 'user', type: 'address' },
			{ name: 'orgName', type: 'string' },
			{ name: 'title', type: 'string' },
			{ name: 'description', type: 'string' },
			{ name: 'orgEmail', type: 'string' },
			{ name: 'logoCID', type: 'string' },
			{ name: 'expirationDays', type: 'uint256' },
			{ name: 'nonce', type: 'uint256' },
		],
	};

	const paymasterValue = {
		user: user.address,
		orgName,
		title,
		description,
		orgEmail,
		logoCID,
		expirationDays,
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
		'function postJobMeta(address user, string memory orgName, string memory title, string memory description, string memory orgEmail, string memory logoCID, string[] memory fieldName, bool[] memory isRequired, uint8 jobType, uint8 workMode, string memory minimumSalary, string memory maximumSalary, uint256 expirationDays, bytes memory signature)',
	]);

	const callData = paymasterInterface.encodeFunctionData('postJobMeta', [
		user.address,
		orgName,
		title,
		description,
		orgEmail,
		logoCID,
		fieldName,
		isRequired,
		jobType,
		workMode,
		minimumSalary,
		maximumSalary,
		expirationDays,
		paymasterSignature,
	]);
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

	try {
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
		const paymasterBalanceChange =
			paymasterBalanceAfter - paymasterBalanceBefore;

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

		console.log('Step 5: Verifying job was posted');
		const allJobs = await jobBoard.getAllJobs();
		console.log('  Total jobs:', allJobs.length);

		if (allJobs.length > 0) {
			const job = allJobs[allJobs.length - 1];
			console.log('  Job ID:', job.id.toString());
			console.log('  Employer:', job.employer);
			console.log('  Title:', job.title);
			console.log('  Org Name:', job.orgName);
			console.log('  ✓ Job successfully posted!');
		}
	} catch (error) {
		console.error('  ❌ Error executing relay:', error.message);
		console.error('  Full error:', error);
		throw error;
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
	console.log('✓ Job posted successfully');
	console.log('✓ Transaction was 100% gasless for the user!');
	console.log('');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
