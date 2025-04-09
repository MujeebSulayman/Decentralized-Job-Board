/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		// Warning: This allows production builds to successfully complete even if
		// your project has ESLint errors.
		ignoreDuringBuilds: true,
	},
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
	async rewrites() {
		return [
			{
				source: '/api/eth/:path*',
				destination: 'https://ethereum-sepolia.publicnode.com/:path*',
			},
		];
	},
};

module.exports = nextConfig;
