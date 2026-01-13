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
		apiKey: {
			base: process.env.BASESCAN_API_KEY || process.env.ETHERSCAN_API_KEY,
			baseSepolia:
				process.env.BASESCAN_API_KEY || process.env.ETHERSCAN_API_KEY,
		},
		customChains: [
			{
				network: 'base',
				chainId: 8453,
				urls: {
					apiURL: 'https://api.basescan.org/api',
					browserURL: 'https://basescan.org',
				},
			},
			{
				network: 'baseSepolia',
				chainId: 84532,
				urls: {
					apiURL: 'https://api-sepolia.basescan.org/api',
					browserURL: 'https://sepolia.basescan.org',
				},
			},
		],
	},
};
