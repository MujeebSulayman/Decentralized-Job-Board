/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: ['ipfs.io', 'gateway.pinata.cloud'],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'gateway.pinata.cloud',
				port: '',
				pathname: '/ipfs/**',
			},
			{
				protocol: 'https',
				hostname: 'ipfs.io',
				port: '',
				pathname: '/ipfs/**',
			},
		],
	},
};

module.exports = nextConfig;
