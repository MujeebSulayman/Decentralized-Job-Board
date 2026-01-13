const { ethers, upgrades } = require('hardhat');

/**
 * @dev Deploy upgradeable JobBoard contract using OpenZeppelin's proxy pattern
 *
 * KEY CONCEPTS:
 * 1. Proxy Pattern:
 *    - Proxy contract (stores data, user interacts with this)
 *    - Implementation contract (stores logic, can be upgraded)
 *    - User always calls proxy, proxy delegates to implementation
 *
 * 2. Storage Layout:
 *    - Storage variables MUST stay in same order across upgrades
 *    - Can add new variables at the END only
 *    - Never remove or reorder existing variables
 *
 * 3. Initializer vs Constructor:
 *    - Constructor runs once when implementation is deployed
 *    - Initializer runs when proxy is first set up
 *    - Use initializer() modifier to prevent re-initialization
 */
async function main() {
	const network = await ethers.provider.getNetwork();
	console.log(
		`Deploying upgradeable JobBoard to ${network.name} (chainId: ${network.chainId})...\n`
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

		// Step 1: Get the contract factory
		const JobBoardUpgradeable = await ethers.getContractFactory(
			'JobBoardUpgradeable'
		);

		console.log('Deploying upgradeable JobBoard...');
		console.log('This will deploy:');
		console.log('  1. Implementation contract (logic)');
		console.log('  2. Proxy contract (storage + delegate)');
		console.log('  3. ProxyAdmin (manages upgrades)\n');

		// Step 2: Deploy using upgrades.deployProxy()
		// This automatically:
		// - Deploys implementation contract
		// - Deploys proxy contract
		// - Deploys ProxyAdmin
		// - Calls initialize() on the proxy
		const jobBoard = await upgrades.deployProxy(
			JobBoardUpgradeable,
			[ethers.parseEther('0.01')], // Constructor args -> initializer args
			{
				initializer: 'initialize', // Function to call for initialization
				kind: 'transparent', // Proxy type: transparent, uups, or beacon
			}
		);

		// Wait for deployment
		await jobBoard.waitForDeployment();
		const proxyAddress = await jobBoard.getAddress();

		console.log('Upgradeable JobBoard deployed!\n');
		console.log('Proxy address (use this!):', proxyAddress);

		// Get implementation address (for verification)
		const implementationAddress =
			await upgrades.erc1967.getImplementationAddress(proxyAddress);
		console.log('Implementation address:', implementationAddress);

		// Get admin address
		const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
		console.log('ProxyAdmin address:', adminAddress, '\n');

		// Step 3: Deploy Paymaster (can be regular or upgradeable)
		console.log('Deploying JobBoardPaymaster...');
		const JobBoardPaymaster = await ethers.getContractFactory(
			'JobBoardPaymaster'
		);

		const paymaster = await JobBoardPaymaster.deploy(
			proxyAddress, // Use proxy address, not implementation!
			'HemBoard',
			'1'
		);
		await paymaster.waitForDeployment();
		const paymasterAddress = await paymaster.getAddress();
		console.log('Paymaster deployed at:', paymasterAddress, '\n');

		// Step 4: Verify deployer is owner
		const owner = await jobBoard.owner();
		const isAdmin = await jobBoard.hasRole(
			await jobBoard.ADMIN_ROLE(),
			deployer.address
		);
		console.log('Verifying deployer permissions...');
		console.log('  Owner:', owner);
		console.log(
			'  Deployer is owner:',
			owner.toLowerCase() === deployer.address.toLowerCase()
		);
		console.log('  Deployer has ADMIN_ROLE:', isAdmin);
		if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
			console.warn('WARNING: Deployer is not the owner!');
		}
		console.log('');

		// Step 5: Enable paymaster
		console.log('Enabling paymaster...');
		const enableTx = await jobBoard.setPaymaster(paymasterAddress, true);
		await enableTx.wait();
		console.log('Paymaster enabled\n');

		// Step 6: Save addresses
		const fs = require('fs');
		const contractsDir = __dirname + '/../contracts';

		if (!fs.existsSync(contractsDir)) {
			fs.mkdirSync(contractsDir);
		}

		fs.writeFileSync(
			contractsDir + '/contractAddress.json',
			JSON.stringify(
				{
					Deployer: deployer.address,
					JobBoardProxy: proxyAddress,
					JobBoardImplementation: implementationAddress,
					ProxyAdmin: adminAddress,
					JobBoardPaymaster: paymasterAddress,
				},
				undefined,
				2
			)
		);

		console.log('Contract addresses saved to contractAddress.json');
		console.log('\n=== Deployment Summary ===');
		console.log('Network:', network.name, `(Chain ID: ${network.chainId})`);
		console.log('Deployer (Owner/Admin):', deployer.address);
		console.log('Proxy (use this address):', proxyAddress);
		console.log('Implementation:', implementationAddress);
		console.log('ProxyAdmin:', adminAddress);
		console.log('Paymaster:', paymasterAddress);
		console.log('\nIMPORTANT:');
		console.log('  - Deployer is the OWNER and ADMIN of JobBoard');
		console.log('  - Deployer is the OWNER of Paymaster');
		console.log('  - Always use PROXY address for interactions');
		console.log('  - ProxyAdmin controls upgrades (keep private key safe!)');
		console.log(
			'  - Keep deployer private key secure - it controls everything!'
		);
		console.log('\nTo upgrade later, run: npm run upgrade:base-sepolia');
	} catch (error) {
		console.error('Error deploying:', error.message);
		throw error;
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
