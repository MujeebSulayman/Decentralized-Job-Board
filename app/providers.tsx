'use client';

import '@rainbow-me/rainbowkit/styles.css';
import {
	darkTheme,
	getDefaultConfig,
	RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
	coinbaseWallet,
	metaMaskWallet,
	trustWallet,
	walletConnectWallet,
	ledgerWallet,
	rabbyWallet,
	berasigWallet,
	argentWallet,
	injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider } from 'wagmi';
import {
	mainnet,
	polygon,
	optimism,
	arbitrum,
	base,
	sepolia,
} from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

const config = getDefaultConfig({
	appName: 'HemBoard',
	projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
	chains: [mainnet, sepolia, polygon, optimism, arbitrum, base],
	ssr: true,
	wallets: [
		{
			groupName: 'Popular',
			wallets: [
				metaMaskWallet,
				coinbaseWallet,
				walletConnectWallet,
				trustWallet,
				berasigWallet,
			],
		},
		{
			groupName: 'More',
			wallets: [ledgerWallet, rabbyWallet, argentWallet, injectedWallet],
		},
	],
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider
					theme={darkTheme({
						accentColor: '#7b3fe4',
						accentColorForeground: 'white',
						borderRadius: 'small',
						fontStack: 'system',
						overlayBlur: 'small',
					})}>
					{mounted && children}
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
