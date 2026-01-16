require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

module.exports = {
	solidity: {
		version: '0.8.28',
		settings: {
			optimizer: {
				enabled: true,
				runs: 0,
			},
			viaIR: true,
		},
	},

	networks: {
		hardhat: {
			blockGasLimit: 30000000,
			gas: 30000000,
		},
		localhost: {
			url: 'http://127.0.0.1:8545',
			chainId: 31337,
		},
		base: {
			url: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
			accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
			chainId: 8453,
		},
		baseSepolia: {
			url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
			accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
			chainId: 84532,
		},
	},

	etherscan: {
		apiKey: process.env.BASESCAN_API_KEY || process.env.ETHERSCAN_API_KEY,
	},
	chainDescriptors: {
		84532: {
			name: 'Base Sepolia',
			blockExplorers: {
				etherscan: {
					name: 'Basescan',
					url: 'https://sepolia.basescan.org',
					apiUrl: 'https://api.etherscan.io/v2/api',
				},
			},
		},
		8453: {
			name: 'Base',
			blockExplorers: {
				etherscan: {
					name: 'Basescan',
					url: 'https://basescan.org',
					apiUrl: 'https://api.etherscan.io/v2/api',
				},
			},
		},
	},
};
