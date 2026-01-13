const { ethers, upgrades } = require('hardhat');
const fs = require('fs');
const path = require('path');

/**
 * @dev Upgrade the JobBoard implementation contract
 * 
 * UPGRADE PROCESS:
 * 1. Deploy new implementation contract
 * 2. Update proxy to point to new implementation
 * 3. All data stays in proxy (no data loss!)
 * 
 * STORAGE LAYOUT RULES:
 * - Keep all existing variables in same order
 * - Can only add new variables at the END
 * - Never remove or reorder variables
 * - Use storage gaps for future-proofing
 */
async function main() {
  const network = await ethers.provider.getNetwork();
  console.log(`Upgrading JobBoard on ${network.name} (chainId: ${network.chainId})...\n`);

  // Load proxy address
  const contractsDir = path.join(__dirname, '../contracts');
  const contractAddressFile = path.join(contractsDir, 'contractAddress.json');

  if (!fs.existsSync(contractAddressFile)) {
    console.error('❌ contractAddress.json not found. Please deploy first.');
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(contractAddressFile, 'utf8'));
  const proxyAddress = addresses.JobBoardProxy || addresses.JobBoard;

  if (!proxyAddress) {
    console.error('❌ Proxy address not found in contractAddress.json');
    process.exit(1);
  }

  console.log('Proxy address:', proxyAddress);
  console.log('Deploying new implementation...\n');

  try {
    // Step 1: Get the new contract factory
    const JobBoardUpgradeableV2 = await ethers.getContractFactory('JobBoardUpgradeable');
    
    // Step 2: Upgrade the proxy
    // This will:
    // - Deploy new implementation
    // - Update proxy to use new implementation
    // - Preserve all existing data
    const upgraded = await upgrades.upgradeProxy(proxyAddress, JobBoardUpgradeableV2);
    
    console.log('✓ Upgrade successful!\n');
    
    // Get new implementation address
    const newImplementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log('New implementation address:', newImplementation);
    console.log('Proxy address (unchanged):', proxyAddress);
    console.log('\n✅ All data preserved - users can continue using same address!');
    
    // Update contract addresses file
    addresses.JobBoardImplementation = newImplementation;
    fs.writeFileSync(
      contractAddressFile,
      JSON.stringify(addresses, undefined, 2)
    );
    
    console.log('\nContract addresses updated in contractAddress.json');
  } catch (error) {
    console.error('❌ Upgrade failed:', error.message);
    
    // Common errors:
    if (error.message.includes('storage')) {
      console.log('\n💡 Tip: Check that storage layout matches previous version!');
    }
    if (error.message.includes('initializer')) {
      console.log('\n💡 Tip: Make sure new version has same initializer or none!');
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
