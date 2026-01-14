const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('JobBoard Integration Tests', function () {
	let jobBoard;
	let paymaster;
	let owner;
	let employer;
	let applicant;
	let sponsor;
	let other;

	const SERVICE_FEE = ethers.parseEther('0.01');
	const DOMAIN_NAME = 'HemBoard';
	const DOMAIN_VERSION = '1';

	async function deployContractsFixture() {
		const [
			deployer,
			employerAccount,
			applicantAccount,
			sponsorAccount,
			otherAccount,
		] = await ethers.getSigners();

		// Deploy upgradeable JobBoard
		const JobBoardUpgradeable = await ethers.getContractFactory(
			'JobBoardUpgradeable'
		);
		const jobBoardProxy = await upgrades.deployProxy(
			JobBoardUpgradeable,
			[SERVICE_FEE],
			{ initializer: 'initialize', kind: 'transparent' }
		);
		await jobBoardProxy.waitForDeployment();
		const jobBoardAddress = await jobBoardProxy.getAddress();

		// Deploy Paymaster
		const JobBoardPaymaster = await ethers.getContractFactory(
			'JobBoardPaymaster'
		);
		const paymasterContract = await JobBoardPaymaster.deploy(
			jobBoardAddress,
			DOMAIN_NAME,
			DOMAIN_VERSION
		);
		await paymasterContract.waitForDeployment();

		// Enable paymaster
		await jobBoardProxy.setPaymaster(
			await paymasterContract.getAddress(),
			true
		);

		return {
			jobBoard: jobBoardProxy,
			paymaster: paymasterContract,
			owner: deployer,
			employer: employerAccount,
			applicant: applicantAccount,
			sponsor: sponsorAccount,
			other: otherAccount,
		};
	}

	beforeEach(async function () {
		const fixture = await loadFixture(deployContractsFixture);
		jobBoard = fixture.jobBoard;
		paymaster = fixture.paymaster;
		owner = fixture.owner;
		employer = fixture.employer;
		applicant = fixture.applicant;
		sponsor = fixture.sponsor;
		other = fixture.other;
	});

	describe('Deployment', function () {
		it('Should deploy JobBoard with correct service fee', async function () {
			expect(await jobBoard.serviceFee()).to.equal(SERVICE_FEE);
		});

		it('Should deploy Paymaster with correct domain', async function () {
			expect(await paymaster.jobBoard()).to.equal(await jobBoard.getAddress());
		});

		it('Should set deployer as owner and admin', async function () {
			expect(await jobBoard.owner()).to.equal(owner.address);
			expect(await jobBoard.hasRole(await jobBoard.ADMIN_ROLE(), owner.address))
				.to.be.true;
		});

		it('Should enable paymaster in JobBoard', async function () {
			expect(await jobBoard.paymaster()).to.equal(await paymaster.getAddress());
			expect(await jobBoard.paymasterEnabled()).to.be.true;
		});
	});

	describe('Upgradeability', function () {
		it('Should upgrade proxy and preserve state', async function () {
			const proxyAddress = await jobBoard.getAddress();
			const JobBoardUpgradeableV2 = await ethers.getContractFactory(
				'JobBoardUpgradeableV2'
			);

			const upgraded = await upgrades.upgradeProxy(
				proxyAddress,
				JobBoardUpgradeableV2
			);

			expect(await upgraded.version()).to.equal(2);
			expect(await upgraded.serviceFee()).to.equal(SERVICE_FEE);
			expect(await upgraded.owner()).to.equal(owner.address);
			expect(await upgraded.paymaster()).to.equal(await paymaster.getAddress());

			await upgraded.connect(owner).setVersionNumber(42);
			expect(await upgraded.versionNumber()).to.equal(42);
		});
	});

	describe('Job Posting - Direct', function () {
		const jobData = {
			orgName: 'Tech Corp',
			title: 'Senior Developer',
			description: 'We are looking for a senior developer',
			orgEmail: 'hr@techcorp.com',
			logoCID: 'QmHash123',
			fieldName: ['Years of Experience', 'Skills'],
			isRequired: [true, false],
			jobType: 0, // FullTime
			workMode: 0, // Remote
			minimumSalary: '50000',
			maximumSalary: '100000',
			expirationDays: 30,
		};

		it('Should post a job successfully', async function () {
			await expect(
				jobBoard
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
					)
			)
				.to.emit(jobBoard, 'JobPosted')
				.withArgs(1, employer.address, jobData.title, jobData.orgName);

			const job = await jobBoard.getJob(1);
			expect(job.id).to.equal(1);
			expect(job.employer).to.equal(employer.address);
			expect(job.title).to.equal(jobData.title);
			expect(job.isOpen).to.be.true;
		});

		it('Should grant EMPLOYER_ROLE after posting', async function () {
			await jobBoard
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

			expect(
				await jobBoard.hasRole(await jobBoard.EMPLOYER_ROLE(), employer.address)
			).to.be.true;
		});

		it('Should revert if service fee is insufficient', async function () {
			await expect(
				jobBoard
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
						{ value: SERVICE_FEE / 2n }
					)
			).to.be.revertedWithCustomError(jobBoard, 'InsufficientFund');
		});

		it('Should revert if required fields are empty', async function () {
			await expect(
				jobBoard
					.connect(employer)
					.postJob(
						'',
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
					)
			).to.be.revertedWithCustomError(jobBoard, 'EmptyString');
		});
	});

	describe('Job Posting - Via Paymaster', function () {
		const jobData = {
			orgName: 'Tech Corp',
			title: 'Senior Developer',
			description: 'We are looking for a senior developer',
			orgEmail: 'hr@techcorp.com',
			logoCID: 'QmHash123',
			fieldName: ['Years of Experience'],
			isRequired: [true],
			jobType: 0,
			workMode: 0,
			minimumSalary: '50000',
			maximumSalary: '100000',
			expirationDays: 30,
		};

		async function createPostJobSignature(user, nonce) {
			const domain = {
				name: DOMAIN_NAME,
				version: DOMAIN_VERSION,
				chainId: (await ethers.provider.getNetwork()).chainId,
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

			const value = {
				user: user.address,
				orgName: jobData.orgName,
				title: jobData.title,
				description: jobData.description,
				orgEmail: jobData.orgEmail,
				logoCID: jobData.logoCID,
				expirationDays: jobData.expirationDays,
				nonce: nonce,
			};

			const signature = await user.signTypedData(domain, types, value);
			return signature;
		}

		it('Should post job via paymaster when owner sponsors', async function () {
			const nonce = await paymaster.getNonce(employer.address);
			const signature = await createPostJobSignature(employer, nonce);

			await expect(
				paymaster
					.connect(owner)
					.postJobMeta(
						employer.address,
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
						signature
					)
			)
				.to.emit(jobBoard, 'JobPosted')
				.to.emit(paymaster, 'TransactionSponsored');

			const job = await jobBoard.getJob(1);
			expect(job.employer).to.equal(employer.address);
			expect(await paymaster.getNonce(employer.address)).to.equal(nonce + 1n);
		});

		it('Should post job via paymaster when whitelisted sponsor sponsors', async function () {
			await paymaster.connect(owner).setSponsorWhitelist(sponsor.address, true);
			const nonce = await paymaster.getNonce(employer.address);
			const signature = await createPostJobSignature(employer, nonce);

			await expect(
				paymaster
					.connect(sponsor)
					.postJobMeta(
						employer.address,
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
						signature
					)
			)
				.to.emit(jobBoard, 'JobPosted')
				.to.emit(paymaster, 'TransactionSponsored');

			const job = await jobBoard.getJob(1);
			expect(job.employer).to.equal(employer.address);
		});

		it('Should revert if non-whitelisted sponsor tries to sponsor', async function () {
			const nonce = await paymaster.getNonce(employer.address);
			const signature = await createPostJobSignature(employer, nonce);

			await expect(
				paymaster
					.connect(sponsor)
					.postJobMeta(
						employer.address,
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
						signature
					)
			).to.be.revertedWith('Not authorized to sponsor');
		});

		it('Should revert if signature is invalid', async function () {
			const nonce = await paymaster.getNonce(employer.address);
			const signature = await createPostJobSignature(applicant, nonce); // Wrong signer

			await expect(
				paymaster
					.connect(owner)
					.postJobMeta(
						employer.address,
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
						signature
					)
			).to.be.revertedWith('Invalid signature');
		});

		it('Should reject replayed signature (nonce changed)', async function () {
			const nonce = await paymaster.getNonce(employer.address);
			const signature = await createPostJobSignature(employer, nonce);

			await paymaster
				.connect(owner)
				.postJobMeta(
					employer.address,
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
					signature
				);

			// Try to use same signature again (nonce changed)
			await expect(
				paymaster
					.connect(owner)
					.postJobMeta(
						employer.address,
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
						signature
					)
			).to.be.revertedWith('Invalid signature');
		});

		it('Should revert if paymaster is disabled', async function () {
			await paymaster.connect(owner).setPaymasterEnabled(false);
			const nonce = await paymaster.getNonce(employer.address);
			const signature = await createPostJobSignature(employer, nonce);

			await expect(
				paymaster
					.connect(owner)
					.postJobMeta(
						employer.address,
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
						signature
					)
			).to.be.revertedWith('Paymaster is disabled');
		});
	});

	describe('Application Submission - Direct', function () {
		let jobId;

		beforeEach(async function () {
			// Post a job first
			await jobBoard.connect(employer).postJob(
				'Tech Corp',
				'Senior Developer',
				'We are looking for a senior developer',
				'hr@techcorp.com',
				'QmHash123',
				['Years of Experience', 'Skills'],
				[true, false],
				0, // FullTime
				0, // Remote
				'50000',
				'100000',
				30,
				{ value: SERVICE_FEE }
			);
			jobId = 1;
		});

		it('Should submit application successfully', async function () {
			const applicationData = {
				name: 'John Doe',
				email: 'john@example.com',
				phoneNumber: '1234567890',
				location: 'New York',
				fieldResponses: ['5 years', 'Solidity, JavaScript'],
				cvCID: 'QmCvHash',
				portfolioLink: 'https://portfolio.com',
				experience: '5 years in blockchain',
				expectedSalary: '80000',
				github: 'github.com/johndoe',
			};

			await expect(
				jobBoard
					.connect(applicant)
					.submitApplication(
						jobId,
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
					)
			)
				.to.emit(jobBoard, 'ApplicationSubmitted')
				.withArgs(
					jobId,
					applicant.address,
					applicationData.name,
					0,
					applicationData.email
				);

			const state = await jobBoard.applicationStates(jobId, applicant.address);
			expect(state).to.equal(0); // PENDING
		});

		it('Should revert if required field is empty', async function () {
			await expect(
				jobBoard.connect(applicant).submitApplication(
					jobId,
					'John Doe',
					'john@example.com',
					'1234567890',
					'New York',
					['', 'Solidity'], // Empty required field
					'QmCvHash',
					'',
					'',
					'',
					''
				)
			).to.be.revertedWithCustomError(jobBoard, 'RequiredFieldEmpty');
		});

		it('Should revert if job is closed', async function () {
			await jobBoard.connect(employer).closeJob(jobId);

			await expect(
				jobBoard
					.connect(applicant)
					.submitApplication(
						jobId,
						'John Doe',
						'john@example.com',
						'1234567890',
						'New York',
						['5 years', 'Solidity'],
						'QmCvHash',
						'',
						'',
						'',
						''
					)
			).to.be.revertedWithCustomError(jobBoard, 'Closed');
		});

		it('Should allow repeat application (current contract behavior)', async function () {
			await jobBoard
				.connect(applicant)
				.submitApplication(
					jobId,
					'John Doe',
					'john@example.com',
					'1234567890',
					'New York',
					['5 years', 'Solidity'],
					'QmCvHash',
					'',
					'',
					'',
					''
				);

			await jobBoard
				.connect(applicant)
				.submitApplication(
					jobId,
					'John Doe',
					'john@example.com',
					'1234567890',
					'New York',
					['5 years', 'Solidity'],
					'QmCvHash',
					'',
					'',
					'',
					''
				);

			const count = await jobBoard
				.connect(employer)
				.getJobApplicationCount(jobId);
			expect(count).to.equal(2);
		});
	});

	describe('Application Submission - Via Paymaster', function () {
		let jobId;

		beforeEach(async function () {
			await jobBoard
				.connect(employer)
				.postJob(
					'Tech Corp',
					'Senior Developer',
					'We are looking for a senior developer',
					'hr@techcorp.com',
					'QmHash123',
					['Years of Experience'],
					[true],
					0,
					0,
					'50000',
					'100000',
					30,
					{ value: SERVICE_FEE }
				);
			jobId = 1;
		});

		async function createSubmitApplicationSignature(user, nonce) {
			const domain = {
				name: DOMAIN_NAME,
				version: DOMAIN_VERSION,
				chainId: (await ethers.provider.getNetwork()).chainId,
				verifyingContract: await paymaster.getAddress(),
			};

			const types = {
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

			const value = {
				user: user.address,
				jobId: jobId,
				name: 'John Doe',
				email: 'john@example.com',
				phoneNumber: '1234567890',
				location: 'New York',
				cvCID: 'QmCvHash',
				nonce: nonce,
			};

			return await user.signTypedData(domain, types, value);
		}

		it('Should submit application via paymaster', async function () {
			await paymaster.connect(owner).setSponsorWhitelist(sponsor.address, true);
			const nonce = await paymaster.getNonce(applicant.address);
			const signature = await createSubmitApplicationSignature(
				applicant,
				nonce
			);

			await expect(
				paymaster
					.connect(sponsor)
					.submitApplicationMeta(
						applicant.address,
						jobId,
						'John Doe',
						'john@example.com',
						'1234567890',
						'New York',
						['5 years'],
						'QmCvHash',
						'',
						'',
						'',
						'',
						signature
					)
			)
				.to.emit(jobBoard, 'ApplicationSubmitted')
				.to.emit(paymaster, 'TransactionSponsored');

			const state = await jobBoard.applicationStates(jobId, applicant.address);
			expect(state).to.equal(0); // PENDING
		});
	});

	describe('Job Management', function () {
		let jobId;

		beforeEach(async function () {
			await jobBoard
				.connect(employer)
				.postJob(
					'Tech Corp',
					'Senior Developer',
					'We are looking for a senior developer',
					'hr@techcorp.com',
					'QmHash123',
					[],
					[],
					0,
					0,
					'50000',
					'100000',
					30,
					{ value: SERVICE_FEE }
				);
			jobId = 1;
		});

		it('Should edit job by employer', async function () {
			await jobBoard
				.connect(employer)
				.editJob(
					jobId,
					'Tech Corp Updated',
					'Senior Developer Updated',
					'Updated description',
					'hr@techcorp.com',
					'QmHash456',
					[],
					[],
					true,
					0,
					0,
					'60000',
					'110000'
				);

			const job = await jobBoard.getJob(jobId);
			expect(job.title).to.equal('Senior Developer Updated');
			expect(job.orgName).to.equal('Tech Corp Updated');
		});

		it('Should delete job by employer', async function () {
			await jobBoard.connect(employer).deleteJob(jobId);
			await expect(jobBoard.getJob(jobId)).to.be.revertedWithCustomError(
				jobBoard,
				'Expired'
			);
		});

		it('Should close job', async function () {
			await jobBoard.connect(employer).closeJob(jobId);
			const job = await jobBoard.getJob(jobId);
			expect(job.isOpen).to.be.false;
		});

		it('Should expire job after next block', async function () {
			await jobBoard.connect(employer).expireJob(jobId);
			await ethers.provider.send('evm_increaseTime', [1]);
			await ethers.provider.send('evm_mine', []);
			await expect(jobBoard.getJob(jobId)).to.be.revertedWithCustomError(
				jobBoard,
				'Expired'
			);
		});

		it('Should revert if non-employer tries to edit', async function () {
			await expect(
				jobBoard
					.connect(other)
					.editJob(
						jobId,
						'Tech Corp Updated',
						'Senior Developer Updated',
						'Updated description',
						'hr@techcorp.com',
						'QmHash456',
						[],
						[],
						true,
						0,
						0,
						'60000',
						'110000'
					)
			).to.be.revertedWithCustomError(jobBoard, 'Unauthorized');
		});
	});

	describe('Application State Management', function () {
		let jobId;

		beforeEach(async function () {
			await jobBoard
				.connect(employer)
				.postJob(
					'Tech Corp',
					'Senior Developer',
					'We are looking for a senior developer',
					'hr@techcorp.com',
					'QmHash123',
					[],
					[],
					0,
					0,
					'50000',
					'100000',
					30,
					{ value: SERVICE_FEE }
				);
			jobId = 1;

			await jobBoard
				.connect(applicant)
				.submitApplication(
					jobId,
					'John Doe',
					'john@example.com',
					'1234567890',
					'New York',
					[],
					'QmCvHash',
					'',
					'',
					'',
					''
				);
		});

		it('Should update application state to SHORTLISTED', async function () {
			await expect(
				jobBoard
					.connect(employer)
					.updateApplicationStatus(jobId, applicant.address, 1) // SHORTLISTED
			)
				.to.emit(jobBoard, 'ApplicationStateChanged')
				.withArgs(jobId, applicant.address, 1);

			const state = await jobBoard.applicationStates(jobId, applicant.address);
			expect(state).to.equal(1); // SHORTLISTED
		});

		it('Should update application state to REJECTED', async function () {
			await jobBoard
				.connect(employer)
				.updateApplicationStatus(jobId, applicant.address, 2); // REJECTED
			const state = await jobBoard.applicationStates(jobId, applicant.address);
			expect(state).to.equal(2); // REJECTED
		});

		it('Should update application state to HIRED', async function () {
			await jobBoard
				.connect(employer)
				.updateApplicationStatus(jobId, applicant.address, 3); // HIRED
			const state = await jobBoard.applicationStates(jobId, applicant.address);
			expect(state).to.equal(3); // HIRED
		});

		it('Should revert if non-employer tries to update state', async function () {
			await expect(
				jobBoard
					.connect(other)
					.updateApplicationStatus(jobId, applicant.address, 1)
			).to.be.revertedWithCustomError(jobBoard, 'Unauthorized');
		});
	});

	describe('Paymaster Management', function () {
		it('Should whitelist sponsor', async function () {
			await expect(
				paymaster.connect(owner).setSponsorWhitelist(sponsor.address, true)
			)
				.to.emit(paymaster, 'SponsorWhitelisted')
				.withArgs(sponsor.address, true);

			expect(await paymaster.whitelistedSponsors(sponsor.address)).to.be.true;
		});

		it('Should remove sponsor from whitelist', async function () {
			await paymaster.connect(owner).setSponsorWhitelist(sponsor.address, true);
			await paymaster
				.connect(owner)
				.setSponsorWhitelist(sponsor.address, false);
			expect(await paymaster.whitelistedSponsors(sponsor.address)).to.be.false;
		});

		it('Should toggle paymaster enabled state', async function () {
			await expect(paymaster.connect(owner).setPaymasterEnabled(false))
				.to.emit(paymaster, 'PaymasterToggled')
				.withArgs(false);

			expect(await paymaster.paymasterEnabled()).to.be.false;
		});

		it('Should update max gas per transaction', async function () {
			const newMaxGas = 1000000;
			await expect(paymaster.connect(owner).setMaxGasPerTransaction(newMaxGas))
				.to.emit(paymaster, 'MaxGasUpdated')
				.withArgs(500000, newMaxGas);

			expect(await paymaster.maxGasPerTransaction()).to.equal(newMaxGas);
		});

		it('Should deposit funds', async function () {
			const depositAmount = ethers.parseEther('1');
			await expect(paymaster.connect(sponsor).deposit({ value: depositAmount }))
				.to.emit(paymaster, 'FundsDeposited')
				.withArgs(sponsor.address, depositAmount);

			expect(await paymaster.getBalance()).to.equal(depositAmount);
		});

		it('Should withdraw funds as owner', async function () {
			const depositAmount = ethers.parseEther('1');
			await paymaster.connect(sponsor).deposit({ value: depositAmount });

			const ownerBalanceBefore = await ethers.provider.getBalance(
				owner.address
			);
			const withdrawAmount = ethers.parseEther('0.5');
			const tx = await paymaster.connect(owner).withdraw(withdrawAmount);
			const receipt = await tx.wait();
			const gasUsed = receipt.gasUsed * receipt.gasPrice;
			const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

			expect(ownerBalanceAfter).to.equal(
				ownerBalanceBefore + withdrawAmount - gasUsed
			);
			expect(await paymaster.getBalance()).to.equal(
				depositAmount - withdrawAmount
			);
		});

		it('Should sponsor transaction directly', async function () {
			await paymaster.connect(owner).setSponsorWhitelist(sponsor.address, true);
			const sponsorAmount = ethers.parseEther('0.1');
			const applicantBalanceBefore = await ethers.provider.getBalance(
				applicant.address
			);

			await paymaster
				.connect(sponsor)
				.sponsorTransaction(applicant.address, { value: sponsorAmount });

			const applicantBalanceAfter = await ethers.provider.getBalance(
				applicant.address
			);
			expect(applicantBalanceAfter).to.equal(
				applicantBalanceBefore + sponsorAmount
			);
		});

		it('Should revert if non-owner tries to withdraw', async function () {
			await paymaster
				.connect(sponsor)
				.deposit({ value: ethers.parseEther('1') });
			await expect(
				paymaster.connect(sponsor).withdraw(ethers.parseEther('0.5'))
			).to.be.revertedWith('Ownable: caller is not the owner');
		});
	});

	describe('Access Control', function () {
		it('Should grant employer role by admin', async function () {
			await jobBoard.connect(owner).grantEmployerRole(employer.address);
			expect(
				await jobBoard.hasRole(await jobBoard.EMPLOYER_ROLE(), employer.address)
			).to.be.true;
		});

		it('Should revert if non-admin tries to grant employer role', async function () {
			await expect(
				jobBoard.connect(other).grantEmployerRole(employer.address)
			).to.be.revertedWithCustomError(jobBoard, 'NotAuthorized');
		});

		it('Should update service fee as owner', async function () {
			const newFee = ethers.parseEther('0.02');
			await expect(jobBoard.connect(owner).updateServiceFee(newFee))
				.to.emit(jobBoard, 'ServiceFeeUpdated')
				.withArgs(SERVICE_FEE, newFee);

			expect(await jobBoard.serviceFee()).to.equal(newFee);
		});

		it('Should revert if non-owner tries to update service fee', async function () {
			await expect(
				jobBoard.connect(other).updateServiceFee(ethers.parseEther('0.02'))
			).to.be.revertedWith('Ownable: caller is not the owner');
		});
	});

	describe('View Functions', function () {
		beforeEach(async function () {
			// Post multiple jobs
			for (let i = 0; i < 3; i++) {
				await jobBoard
					.connect(employer)
					.postJob(
						`Tech Corp ${i}`,
						`Developer ${i}`,
						'Description',
						'hr@techcorp.com',
						'QmHash123',
						[],
						[],
						0,
						0,
						'50000',
						'100000',
						30,
						{ value: SERVICE_FEE }
					);
			}
		});

		it('Should get all jobs', async function () {
			const jobs = await jobBoard.getAllJobs();
			expect(jobs.length).to.equal(3);
		});

		it('Should get employer jobs', async function () {
			const jobs = await jobBoard.connect(employer).getMyJobs();
			expect(jobs.length).to.equal(3);
		});

		it('Should get job applicants', async function () {
			await jobBoard
				.connect(applicant)
				.submitApplication(
					1,
					'John Doe',
					'john@example.com',
					'1234567890',
					'New York',
					[],
					'QmCvHash',
					'',
					'',
					'',
					''
				);

			const applicants = await jobBoard.getJobApplicants(1);
			expect(applicants.length).to.equal(1);
			expect(applicants[0]).to.equal(applicant.address);
		});

		it('Should get job application count', async function () {
			await jobBoard
				.connect(applicant)
				.submitApplication(
					1,
					'John Doe',
					'john@example.com',
					'1234567890',
					'New York',
					[],
					'QmCvHash',
					'',
					'',
					'',
					''
				);

			const count = await jobBoard.connect(employer).getJobApplicationCount(1);
			expect(count).to.equal(1);
		});
	});

	describe('Fund Withdrawal', function () {
		it('Should withdraw funds from JobBoard as owner', async function () {
			// Post a job to accumulate fees
			await jobBoard
				.connect(employer)
				.postJob(
					'Tech Corp',
					'Senior Developer',
					'Description',
					'hr@techcorp.com',
					'QmHash123',
					[],
					[],
					0,
					0,
					'50000',
					'100000',
					30,
					{ value: SERVICE_FEE }
				);

			const balanceBefore = await ethers.provider.getBalance(owner.address);
			const contractBalance = await ethers.provider.getBalance(
				await jobBoard.getAddress()
			);
			const tx = await jobBoard.connect(owner).withdrawFunds();
			const receipt = await tx.wait();
			const gasUsed = receipt.gasUsed * receipt.gasPrice;
			const balanceAfter = await ethers.provider.getBalance(owner.address);

			expect(balanceAfter).to.equal(balanceBefore + contractBalance - gasUsed);
			expect(
				await ethers.provider.getBalance(await jobBoard.getAddress())
			).to.equal(0);
		});

		it('Should revert if contract has no funds', async function () {
			await expect(
				jobBoard.connect(owner).withdrawFunds()
			).to.be.revertedWithCustomError(jobBoard, 'InsufficientFunds');
		});
	});

	describe('Edge Cases', function () {
		it('Should handle job expiration correctly', async function () {
			await jobBoard.connect(employer).postJob(
				'Tech Corp',
				'Senior Developer',
				'Description',
				'hr@techcorp.com',
				'QmHash123',
				[],
				[],
				0,
				0,
				'50000',
				'100000',
				1, // 1 day expiration
				{ value: SERVICE_FEE }
			);

			// Fast forward time
			await ethers.provider.send('evm_increaseTime', [2 * 24 * 60 * 60]); // 2 days
			await ethers.provider.send('evm_mine', []);

			await jobBoard.checkJobExpiration(1);
			const isExpired = await jobBoard.isJobExpired(1);
			expect(isExpired).to.be.true;
		});

		it('Should track sponsor gas spent', async function () {
			await paymaster.connect(owner).setSponsorWhitelist(sponsor.address, true);

			const jobData = {
				orgName: 'Tech Corp',
				title: 'Senior Developer',
				description: 'Description',
				orgEmail: 'hr@techcorp.com',
				logoCID: 'QmHash123',
				fieldName: [],
				isRequired: [],
				jobType: 0,
				workMode: 0,
				minimumSalary: '50000',
				maximumSalary: '100000',
				expirationDays: 30,
			};

			const nonce = await paymaster.getNonce(employer.address);
			const domain = {
				name: DOMAIN_NAME,
				version: DOMAIN_VERSION,
				chainId: (await ethers.provider.getNetwork()).chainId,
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
			const value = {
				user: employer.address,
				orgName: jobData.orgName,
				title: jobData.title,
				description: jobData.description,
				orgEmail: jobData.orgEmail,
				logoCID: jobData.logoCID,
				expirationDays: jobData.expirationDays,
				nonce: nonce,
			};
			const signature = await employer.signTypedData(domain, types, value);

			await paymaster
				.connect(sponsor)
				.postJobMeta(
					employer.address,
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
					signature
				);

			const gasSpent = await paymaster.getSponsorGasSpent(sponsor.address);
			expect(gasSpent).to.be.gt(0);
		});
	});
});
