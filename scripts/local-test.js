const fs = require('node:fs');
const path = require('node:path');
const { ethers, upgrades } = require('hardhat');

async function deployLocal() {
	// Get signers from hardhat (uses --network localhost)
	const [deployerSigner] = await ethers.getSigners();

	const JobBoardUpgradeable = await ethers.getContractFactory(
		'JobBoardUpgradeable',
		deployerSigner
	);
	const jobBoard = await upgrades.deployProxy(
		JobBoardUpgradeable,
		[ethers.parseEther('0.01')],
		{
			initializer: 'initialize',
			kind: 'transparent',
		}
	);
	await jobBoard.waitForDeployment();
	const proxyAddress = await jobBoard.getAddress();

	const JobBoardPaymaster = await ethers.getContractFactory(
		'JobBoardPaymaster',
		deployerSigner
	);
	const paymaster = await JobBoardPaymaster.deploy(
		proxyAddress,
		'HemBoard',
		'1'
	);
	await paymaster.waitForDeployment();

	await jobBoard.setPaymaster(await paymaster.getAddress(), true);

	return {
		jobBoard: await jobBoard.getAddress(),
		paymaster: await paymaster.getAddress(),
	};
}

function loadAddresses() {
	const filePath = path.join(
		__dirname,
		'..',
		'contracts',
		'contractAddress.json'
	);
	if (!fs.existsSync(filePath)) return null;

	try {
		const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
		if (data.JobBoardProxy && data.JobBoardPaymaster) {
			return {
				jobBoard: data.JobBoardProxy,
				paymaster: data.JobBoardPaymaster,
			};
		}
	} catch (error) {
		return null;
	}

	return null;
}

async function checkContractExists(provider, address) {
	try {
		const code = await provider.getCode(address);
		return code && code !== '0x';
	} catch (error) {
		return false;
	}
}

async function main() {
	console.log('🔍 Testing JobBoard Smart Contracts');
	console.log('====================================\n');

	try {
		// Connect to localhost network
		const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
		const deployer = new ethers.Wallet(
			'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
			provider
		);
		const employer = new ethers.Wallet(
			'0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
			provider
		);
		const applicant = new ethers.Wallet(
			'0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
			provider
		);
		const sponsor = new ethers.Wallet(
			'0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
			provider
		);
		const other = new ethers.Wallet(
			'0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
			provider
		);

		console.log(`👤 Deployer: ${deployer.address}`);
		console.log(`👤 Employer: ${employer.address}`);
		console.log(`👤 Applicant: ${applicant.address}`);
		console.log(`👤 Sponsor: ${sponsor.address}`);
		console.log(`👤 Other: ${other.address}\n`);

		// Always deploy fresh contracts on localhost for testing
		console.log('ℹ️ Deploying fresh contracts on localhost...');
		addresses = await deployLocal();
		console.log('✅ Contracts deployed locally\n');

		// Connect to contracts
		const jobBoard = await ethers.getContractAt(
			'JobBoardUpgradeable',
			addresses.jobBoard,
			deployer
		);
		const paymaster = await ethers.getContractAt(
			'JobBoardPaymaster',
			addresses.paymaster,
			deployer
		);

		console.log(`✅ JobBoard: ${await jobBoard.getAddress()}`);
		console.log(`✅ Paymaster: ${await paymaster.getAddress()}\n`);

		const SERVICE_FEE = ethers.parseEther('0.01');
		const DOMAIN_NAME = 'HemBoard';
		const DOMAIN_VERSION = '1';

		// Test 1: Initial State
		console.log('🔍 Test 1: Initial State');
		const initialServiceFee = await jobBoard.serviceFee();
		console.log(`✅ Service fee: ${ethers.formatEther(initialServiceFee)} ETH`);
		const owner = await jobBoard.owner();
		console.log(`✅ Owner: ${owner}`);
		const isAdmin = await jobBoard.hasRole(
			await jobBoard.ADMIN_ROLE(),
			deployer.address
		);
		console.log(`✅ Deployer is admin: ${isAdmin}`);
		const paymasterAddress = await jobBoard.paymaster();
		console.log(`✅ Paymaster address: ${paymasterAddress}`);
		const paymasterEnabled = await jobBoard.paymasterEnabled();
		console.log(`✅ Paymaster enabled: ${paymasterEnabled}\n`);

		// Test 2: Update Service Fee
		console.log('🔍 Test 2: Update Service Fee');
		const newFee = ethers.parseEther('0.02');
		const updateFeeTx = await jobBoard
			.connect(deployer)
			.updateServiceFee(newFee);
		await updateFeeTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const updatedFee = await jobBoard.serviceFee();
		console.log(
			`✅ Service fee updated to: ${ethers.formatEther(updatedFee)} ETH`
		);
		// Reset back
		await jobBoard.connect(deployer).updateServiceFee(SERVICE_FEE);
		await new Promise((resolve) => setTimeout(resolve, 1000));
		console.log(
			`✅ Service fee reset to: ${ethers.formatEther(SERVICE_FEE)} ETH\n`
		);

		// Test 3: Grant Employer Role
		console.log('🔍 Test 3: Grant Employer Role');
		const grantRoleTx = await jobBoard
			.connect(deployer)
			.grantEmployerRole(employer.address);
		await grantRoleTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const hasEmployerRole = await jobBoard.hasRole(
			await jobBoard.EMPLOYER_ROLE(),
			employer.address
		);
		console.log(`✅ Employer role granted: ${hasEmployerRole}\n`);

		// Test 4: Post Job (Direct)
		console.log('🔍 Test 4: Post Job (Direct)');
		const jobData = {
			orgName: 'Tech Corp',
			title: 'Senior Developer',
			description:
				'We are looking for a senior developer with 5+ years experience',
			orgEmail: 'hr@techcorp.com',
			logoCID: 'QmHash123',
			fieldName: ['Years of Experience', 'Skills', 'Portfolio'],
			isRequired: [true, true, false],
			jobType: 0, // FullTime
			workMode: 0, // Remote
			minimumSalary: '50000',
			maximumSalary: '100000',
			expirationDays: 30,
		};

		const postJobTx = await jobBoard
			.connect(employer)
			.postJob(
				jobData.orgName,
				jobData.title,
				jobData.description,
				jobData.orgEmail,
				jobData.logoCID,
				jobData.fieldName,
				jobData.isRequired,
				jobData.jobType,
				jobData.workMode,
				jobData.minimumSalary,
				jobData.maximumSalary,
				jobData.expirationDays,
				{ value: SERVICE_FEE }
			);
		await postJobTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const job1 = await jobBoard.getJob(1);
		console.log(`✅ Job posted with ID: 1`);
		console.log(`   Title: ${job1.title}`);
		console.log(`   Employer: ${job1.employer}`);
		console.log(`   Organization: ${job1.orgName}`);
		console.log(`   Is Open: ${job1.isOpen}`);
		console.log(`   Job Type: ${job1.jobType} (FullTime)`);
		console.log(`   Work Mode: ${job1.workMode} (Remote)`);
		console.log(`   Custom Fields: ${job1.customField.length}\n`);

		// Test 5: Get All Jobs
		console.log('🔍 Test 5: Get All Jobs');
		const allJobs = await jobBoard.getAllJobs();
		console.log(`✅ Total available jobs: ${allJobs.length}`);
		console.log(`   Job 1 in list: ${allJobs.length > 0}\n`);

		// Test 6: Get My Jobs
		console.log('🔍 Test 6: Get My Jobs');
		const myJobs = await jobBoard.connect(employer).getMyJobs();
		console.log(`✅ Employer's jobs: ${myJobs.length}`);
		console.log(`   First job title: ${myJobs[0]?.title || 'N/A'}\n`);

		// Test 7: Edit Job
		console.log('🔍 Test 7: Edit Job');
		const editJobTx = await jobBoard
			.connect(employer)
			.editJob(
				1,
				'Tech Corp Updated',
				'Senior Developer Updated',
				'Updated description with more details',
				'hr@techcorp.com',
				'QmHash456',
				['Years of Experience', 'Skills'],
				[true, false],
				true,
				0,
				0,
				'60000',
				'110000'
			);
		await editJobTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const editedJob = await jobBoard.getJob(1);
		console.log(`✅ Job edited successfully`);
		console.log(`   Updated title: ${editedJob.title}`);
		console.log(`   Updated org: ${editedJob.orgName}`);
		console.log(`   Updated fields: ${editedJob.customField.length}\n`);

		// Test 8: Submit Application (Direct)
		console.log('🔍 Test 8: Submit Application (Direct)');
		// Get the current job to match field responses
		const currentJob = await jobBoard.getJob(1);
		const applicationData = {
			name: 'John Doe',
			email: 'john@example.com',
			phoneNumber: '1234567890',
			location: 'New York',
			fieldResponses:
				currentJob.customField.length === 2
					? ['5 years', 'Solidity, JavaScript, React'] // Match edited job (2 fields)
					: ['5 years', 'Solidity, JavaScript, React', 'https://portfolio.com'], // Original job (3 fields)
			cvCID: 'QmCvHash',
			portfolioLink: 'https://portfolio.com/johndoe',
			experience: '5 years in blockchain development',
			expectedSalary: '80000',
			github: 'github.com/johndoe',
		};

		const submitAppTx = await jobBoard
			.connect(applicant)
			.submitApplication(
				1,
				applicationData.name,
				applicationData.email,
				applicationData.phoneNumber,
				applicationData.location,
				applicationData.fieldResponses,
				applicationData.cvCID,
				applicationData.portfolioLink,
				applicationData.experience,
				applicationData.expectedSalary,
				applicationData.github
			);
		await submitAppTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const appState = await jobBoard.applicationStates(1, applicant.address);
		console.log(`✅ Application submitted`);
		console.log(`   Applicant: ${applicant.address}`);
		console.log(`   Application state: ${appState} (PENDING)\n`);

		// Test 9: Get Job Applicants
		console.log('🔍 Test 9: Get Job Applicants');
		const applicants = await jobBoard.getJobApplicants(1);
		console.log(`✅ Job applicants: ${applicants.length}`);
		console.log(`   First applicant: ${applicants[0]}\n`);

		// Test 10: Get Job Application Count
		console.log('🔍 Test 10: Get Job Application Count');
		const appCount = await jobBoard.connect(employer).getJobApplicationCount(1);
		console.log(`✅ Application count: ${appCount}\n`);

		// Test 11: Get Job Applicant Details
		console.log('🔍 Test 11: Get Job Applicant Details');
		const applicantDetails = await jobBoard
			.connect(employer)
			.getJobApplicantDetails(1, 0);
		console.log(`✅ Applicant details retrieved`);
		console.log(`   Name: ${applicantDetails.name}`);
		console.log(`   Email: ${applicantDetails.email}`);
		console.log(
			`   Current State: ${applicantDetails.currentState} (PENDING)\n`
		);

		// Test 12: Get Job Applications
		console.log('🔍 Test 12: Get Job Applications');
		const applications = await jobBoard.connect(employer).getJobApplications(1);
		console.log(`✅ Applications retrieved: ${applications.length}`);
		console.log(`   First application name: ${applications[0]?.name}\n`);

		// Test 13: Update Application Status - SHORTLISTED
		console.log('🔍 Test 13: Update Application Status - SHORTLISTED');
		const shortlistTx = await jobBoard
			.connect(employer)
			.updateApplicationStatus(1, applicant.address, 1); // SHORTLISTED
		await shortlistTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const shortlistedState = await jobBoard.applicationStates(
			1,
			applicant.address
		);
		console.log(`✅ Application shortlisted`);
		console.log(`   New state: ${shortlistedState} (SHORTLISTED)\n`);

		// Test 14: Update Application Status - REJECTED
		console.log('🔍 Test 14: Update Application Status - REJECTED');
		const rejectTx = await jobBoard
			.connect(employer)
			.updateApplicationStatus(1, applicant.address, 2); // REJECTED
		await rejectTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const rejectedState = await jobBoard.applicationStates(
			1,
			applicant.address
		);
		console.log(`✅ Application rejected`);
		console.log(`   New state: ${rejectedState} (REJECTED)\n`);

		// Reset to PENDING for next test
		await jobBoard
			.connect(employer)
			.updateApplicationStatus(1, applicant.address, 0);
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Test 15: Update Application Status - HIRED
		console.log('🔍 Test 15: Update Application Status - HIRED');
		const hireTx = await jobBoard
			.connect(employer)
			.updateApplicationStatus(1, applicant.address, 3); // HIRED
		await hireTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const hiredState = await jobBoard.applicationStates(1, applicant.address);
		console.log(`✅ Application hired`);
		console.log(`   New state: ${hiredState} (HIRED)\n`);

		// Test 16: Close Job
		console.log('🔍 Test 16: Close Job');
		const closeJobTx = await jobBoard.connect(employer).closeJob(1);
		await closeJobTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const closedJob = await jobBoard.getJob(1);
		console.log(`✅ Job closed`);
		console.log(`   Is open: ${closedJob.isOpen}\n`);

		// Reopen for next tests
		await jobBoard
			.connect(employer)
			.editJob(
				1,
				closedJob.orgName,
				closedJob.title,
				closedJob.description,
				closedJob.orgEmail,
				closedJob.logoCID,
				[],
				[],
				true,
				0,
				0,
				closedJob.minimumSalary,
				closedJob.maximumSalary
			);
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Test 17: Expire Job
		console.log('🔍 Test 17: Expire Job');
		const expireJobTx = await jobBoard.connect(employer).expireJob(1);
		await expireJobTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));
		console.log(`✅ Job expired\n`);

		// Test 18: Check Job Expiration
		console.log('🔍 Test 18: Check Job Expiration');
		const isExpired = await jobBoard.isJobExpired(1);
		console.log(`✅ Job is expired: ${isExpired}\n`);

		// Post a new job for remaining tests
		console.log('🔍 Posting new job for remaining tests...');
		const newJobTx = await jobBoard.connect(employer).postJob(
			'New Tech Corp',
			'Junior Developer',
			'Looking for junior developer',
			'hr@newtech.com',
			'QmHash789',
			[],
			[],
			1, // PartTime
			1, // Onsite
			'30000',
			'50000',
			30,
			{ value: SERVICE_FEE }
		);
		await newJobTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));
		console.log('✅ New job posted (ID: 2)\n');

		// Test 19: Delete Job
		console.log('🔍 Test 19: Delete Job');
		const deleteJobTx = await jobBoard.connect(employer).deleteJob(2);
		await deleteJobTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));
		console.log(`✅ Job deleted\n`);

		// Test 20: Paymaster - Whitelist Sponsor
		console.log('🔍 Test 20: Paymaster - Whitelist Sponsor');
		const whitelistTx = await paymaster
			.connect(deployer)
			.setSponsorWhitelist(sponsor.address, true);
		await whitelistTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const isWhitelisted = await paymaster.whitelistedSponsors(sponsor.address);
		console.log(`✅ Sponsor whitelisted: ${isWhitelisted}\n`);

		// Test 21: Paymaster - Get Nonce
		console.log('🔍 Test 21: Paymaster - Get Nonce');
		const nonce = await paymaster.getNonce(employer.address);
		console.log(`✅ Nonce for employer: ${nonce}\n`);

		// Test 22: Paymaster - Deposit Funds
		console.log('🔍 Test 22: Paymaster - Deposit Funds');
		const depositAmount = ethers.parseEther('1');
		const depositTx = await paymaster
			.connect(sponsor)
			.deposit({ value: depositAmount });
		await depositTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const balance = await paymaster.getBalance();
		console.log(`✅ Funds deposited`);
		console.log(`   Paymaster balance: ${ethers.formatEther(balance)} ETH\n`);

		// Test 23: Paymaster - Get Sponsor Gas Spent
		console.log('🔍 Test 23: Paymaster - Get Sponsor Gas Spent');
		const gasSpent = await paymaster.getSponsorGasSpent(sponsor.address);
		console.log(`✅ Sponsor gas spent: ${gasSpent}\n`);

		// Test 24: Paymaster - Set Max Gas Per Transaction
		console.log('🔍 Test 24: Paymaster - Set Max Gas Per Transaction');
		const newMaxGas = 1000000;
		const setMaxGasTx = await paymaster
			.connect(deployer)
			.setMaxGasPerTransaction(newMaxGas);
		await setMaxGasTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const maxGas = await paymaster.maxGasPerTransaction();
		console.log(`✅ Max gas updated: ${maxGas}\n`);

		// Test 25: Paymaster - Toggle Enabled
		console.log('🔍 Test 25: Paymaster - Toggle Enabled');
		const disableTx = await paymaster
			.connect(deployer)
			.setPaymasterEnabled(false);
		await disableTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const isEnabled = await paymaster.paymasterEnabled();
		console.log(`✅ Paymaster disabled: ${!isEnabled}`);

		// Re-enable
		await paymaster.connect(deployer).setPaymasterEnabled(true);
		await new Promise((resolve) => setTimeout(resolve, 1000));
		console.log(`✅ Paymaster re-enabled\n`);

		// Test 26: Paymaster - Sponsor Transaction Directly
		console.log('🔍 Test 26: Paymaster - Sponsor Transaction Directly');
		const sponsorAmount = ethers.parseEther('0.1');
		const applicantBalanceBefore = await provider.getBalance(applicant.address);
		const sponsorTxTx = await paymaster
			.connect(sponsor)
			.sponsorTransaction(applicant.address, { value: sponsorAmount });
		await sponsorTxTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const applicantBalanceAfter = await provider.getBalance(applicant.address);
		console.log(`✅ Transaction sponsored`);
		console.log(`   Amount sent: ${ethers.formatEther(sponsorAmount)} ETH`);
		console.log(
			`   Applicant balance increased: ${
				applicantBalanceAfter > applicantBalanceBefore
			}\n`
		);

		// Test 27: Paymaster - Post Job Meta Transaction
		console.log('🔍 Test 27: Paymaster - Post Job Meta Transaction');
		const metaNonce = await paymaster.getNonce(employer.address);
		const jobsBefore = await jobBoard.getAllJobs();
		const domain = {
			name: DOMAIN_NAME,
			version: DOMAIN_VERSION,
			chainId: (await provider.getNetwork()).chainId,
			verifyingContract: await paymaster.getAddress(),
		};
		const types = {
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
		const metaJobData = {
			orgName: 'Meta Tech Corp',
			title: 'Meta Developer',
			description: 'Meta transaction job posting',
			orgEmail: 'hr@metacorp.com',
			logoCID: 'QmMetaHash',
			expirationDays: 30,
		};
		const value = {
			user: employer.address,
			orgName: metaJobData.orgName,
			title: metaJobData.title,
			description: metaJobData.description,
			orgEmail: metaJobData.orgEmail,
			logoCID: metaJobData.logoCID,
			expirationDays: metaJobData.expirationDays,
			nonce: metaNonce,
		};
		const signature = await employer.signTypedData(domain, types, value);

		const postJobMetaTx = await paymaster.connect(sponsor).postJobMeta(
			employer.address,
			metaJobData.orgName,
			metaJobData.title,
			metaJobData.description,
			metaJobData.orgEmail,
			metaJobData.logoCID,
			[],
			[],
			2, // Internship
			2, // Hybrid
			'40000',
			'60000',
			metaJobData.expirationDays,
			signature
		);
		await postJobMetaTx.wait();
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Get job ID by comparing job counts
		const jobsAfter = await jobBoard.getAllJobs();
		const metaJobId =
			jobsAfter.length > jobsBefore.length
				? jobsAfter[jobsAfter.length - 1].id
				: null;

		console.log(`✅ Meta transaction job posted`);
		console.log(`   Job ID: ${metaJobId || 'N/A'}`);
		const newNonce = await paymaster.getNonce(employer.address);
		console.log(`   Nonce incremented: ${newNonce === metaNonce + 1n}\n`);

		// Test 28: Paymaster - Submit Application Meta Transaction
		console.log('🔍 Test 28: Paymaster - Submit Application Meta Transaction');
		if (metaJobId) {
			const appMetaNonce = await paymaster.getNonce(applicant.address);
			const appTypes = {
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
			const appValue = {
				user: applicant.address,
				jobId: metaJobId,
				name: 'Jane Doe',
				email: 'jane@example.com',
				phoneNumber: '9876543210',
				location: 'San Francisco',
				cvCID: 'QmCvMetaHash',
				nonce: appMetaNonce,
			};
			const appSignature = await applicant.signTypedData(
				domain,
				appTypes,
				appValue
			);

			const submitAppMetaTx = await paymaster
				.connect(sponsor)
				.submitApplicationMeta(
					applicant.address,
					appValue.jobId,
					appValue.name,
					appValue.email,
					appValue.phoneNumber,
					appValue.location,
					[],
					appValue.cvCID,
					'https://janeportfolio.com',
					'3 years experience',
					'70000',
					'github.com/janedoe',
					appSignature
				);
			await submitAppMetaTx.wait();
			await new Promise((resolve) => setTimeout(resolve, 1000));

			console.log(`✅ Meta transaction application submitted`);
			const newAppNonce = await paymaster.getNonce(applicant.address);
			console.log(
				`   Nonce incremented: ${newAppNonce === appMetaNonce + 1n}\n`
			);
		} else {
			console.log(`ℹ️ Skipping - no meta job ID available\n`);
		}

		// Test 29: Paymaster - Withdraw Funds
		console.log('🔍 Test 29: Paymaster - Withdraw Funds');
		const withdrawAmount = ethers.parseEther('0.5');
		const ownerBalanceBefore = await provider.getBalance(deployer.address);
		const withdrawTx = await paymaster
			.connect(deployer)
			.withdraw(withdrawAmount);
		const receipt = await withdrawTx.wait();
		const gasUsed = receipt.gasUsed * receipt.gasPrice;
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const ownerBalanceAfter = await provider.getBalance(deployer.address);
		const finalBalance = await paymaster.getBalance();
		console.log(`✅ Funds withdrawn`);
		console.log(
			`   Amount withdrawn: ${ethers.formatEther(withdrawAmount)} ETH`
		);
		console.log(
			`   Remaining balance: ${ethers.formatEther(finalBalance)} ETH\n`
		);

		// Test 30: JobBoard - Withdraw Funds
		console.log('🔍 Test 30: JobBoard - Withdraw Funds');
		const jobBoardBalance = await provider.getBalance(
			await jobBoard.getAddress()
		);
		if (jobBoardBalance > 0n) {
			const jobBoardWithdrawTx = await jobBoard
				.connect(deployer)
				.withdrawFunds();
			await jobBoardWithdrawTx.wait();
			await new Promise((resolve) => setTimeout(resolve, 1000));
			console.log(`✅ JobBoard funds withdrawn`);
			console.log(`   Amount: ${ethers.formatEther(jobBoardBalance)} ETH\n`);
		} else {
			console.log(`ℹ️ No funds to withdraw from JobBoard\n`);
		}

		// Test 31: Check Job Expiration Status
		console.log('🔍 Test 31: Check Job Expiration Status');
		if (metaJobId) {
			const job3 = await jobBoard.getJob(metaJobId);
			const isJob3Expired = await jobBoard.isJobExpired(metaJobId);
			console.log(`✅ Job expiration check`);
			console.log(`   Job ID: ${metaJobId}`);
			console.log(`   Is expired: ${isJob3Expired}`);
			console.log(
				`   Expiration time: ${new Date(
					Number(job3.expirationTime) * 1000
				).toLocaleString()}\n`
			);
		} else {
			console.log(`ℹ️ Skipping - no meta job ID available\n`);
		}

		// Test 32: Check Application States
		console.log('🔍 Test 32: Check Application States');
		if (metaJobId) {
			const metaAppState = await jobBoard.applicationStates(
				metaJobId,
				applicant.address
			);
			console.log(`✅ Application state for meta job`);
			console.log(`   State: ${metaAppState} (PENDING)\n`);
		} else {
			console.log(`ℹ️ Skipping - no meta job ID available\n`);
		}

		// Test 33: Final State Summary
		console.log('🔍 Test 33: Final State Summary');
		const finalAllJobs = await jobBoard.getAllJobs();
		const finalMyJobs = await jobBoard.connect(employer).getMyJobs();
		const finalPaymasterBalance = await paymaster.getBalance();
		const finalJobBoardBalance = await provider.getBalance(
			await jobBoard.getAddress()
		);

		console.log(`✅ Final State:`);
		console.log(`   Total available jobs: ${finalAllJobs.length}`);
		console.log(`   Employer's jobs: ${finalMyJobs.length}`);
		console.log(
			`   Paymaster balance: ${ethers.formatEther(finalPaymasterBalance)} ETH`
		);
		console.log(
			`   JobBoard balance: ${ethers.formatEther(finalJobBoardBalance)} ETH\n`
		);

		console.log('✅ All tests completed successfully!');
	} catch (error) {
		console.error('❌ Test failed:', error);
		if (error.reason) {
			console.error(`   Reason: ${error.reason}`);
		}
		if (error.data) {
			console.error(`   Data: ${error.data}`);
		}
		process.exit(1);
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
