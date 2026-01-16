import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import address from '../../../../contracts/contractAddress.json';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userAddress, callData, deadline, relayerSignature } = body;

		// Validate required fields
		if (!userAddress || !callData || !deadline || !relayerSignature) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Check if deadline has passed
		if (Math.floor(Date.now() / 1000) > deadline) {
			return NextResponse.json({ error: 'Request expired' }, { status: 400 });
		}

		// Get relayer private key from environment
		const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
		if (!relayerPrivateKey) {
			console.error('RELAYER_PRIVATE_KEY not set in environment');
			return NextResponse.json(
				{
					error:
						'Relayer not configured. Please set RELAYER_PRIVATE_KEY in .env',
				},
				{ status: 500 }
			);
		}

		// Get relayer contract address
		const relayerAddress = address.JobBoardRelayer;
		if (!relayerAddress) {
			return NextResponse.json(
				{
					error:
						'Relayer contract not deployed. Please deploy the relayer contract first.',
				},
				{ status: 500 }
			);
		}

		// Get RPC URL
		const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;
		if (!rpcUrl) {
			return NextResponse.json(
				{ error: 'RPC URL not configured' },
				{ status: 500 }
			);
		}

		// Connect to network with relayer account
		const provider = new ethers.JsonRpcProvider(rpcUrl);
		const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider);

		// Connect to relayer contract
		const relayerAbi = [
			'function executeRelay(address user, bytes calldata data, uint256 deadline, bytes memory signature) external returns (bool)',
		];
		const relayer = new ethers.Contract(
			relayerAddress,
			relayerAbi,
			relayerWallet
		);

		// Execute relay transaction (relayer pays gas)
		let tx;
		try {
			tx = await relayer.executeRelay(
				userAddress,
				callData,
				deadline,
				relayerSignature
			);
		} catch (estimateError: any) {
			console.error('Estimate gas error:', estimateError);
			const errorMessage =
				estimateError.reason || estimateError.message || 'Unknown error';
			return NextResponse.json(
				{
					error: 'Transaction would fail',
					details: errorMessage,
					fullError: estimateError.toString(),
				},
				{ status: 400 }
			);
		}

		// Wait for transaction
		const receipt = await tx.wait();

		return NextResponse.json({
			success: true,
			transactionHash: receipt.hash,
			receipt,
		});
	} catch (error: any) {
		console.error('Relayer error:', error);
		console.error('Error details:', {
			message: error.message,
			reason: error.reason,
			data: error.data,
			code: error.code,
		});
		return NextResponse.json(
			{
				error: error.message || 'Failed to relay transaction',
				details: error.reason || error.data?.message || error.toString(),
			},
			{ status: 500 }
		);
	}
}
