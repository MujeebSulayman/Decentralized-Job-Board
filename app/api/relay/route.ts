import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import address from '../../../contracts/contractAddress.json';

// This will be set after deploying the relayer contract
const RELAYER_ADDRESS = process.env.RELAYER_CONTRACT_ADDRESS || '';

const RELAYER_DOMAIN_NAME = 'HemBoardRelayer';
const RELAYER_DOMAIN_VERSION = '1';

interface RelayRequest {
	userAddress: string;
	functionName: string;
	params: any[];
	deadline: number;
	signature: string;
}

export async function POST(request: NextRequest) {
	try {
		if (!RELAYER_ADDRESS) {
			return NextResponse.json(
				{ error: 'Relayer contract not deployed' },
				{ status: 500 }
			);
		}

		const body: RelayRequest = await request.json();
		const { userAddress, functionName, params, deadline, signature } = body;

		// Validate deadline
		if (Date.now() / 1000 > deadline) {
			return NextResponse.json({ error: 'Request expired' }, { status: 400 });
		}

		// Get relayer private key from environment
		const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
		if (!relayerPrivateKey) {
			return NextResponse.json(
				{ error: 'Relayer not configured' },
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

		// Connect to network
		const provider = new ethers.JsonRpcProvider(rpcUrl);
		const relayer = new ethers.Wallet(relayerPrivateKey, provider);

		// Load relayer ABI (we'll need to compile and get this)
		// For now, using interface
		const relayerAbi = [
			'function executeRelay(address user, bytes calldata data, uint256 deadline, bytes memory signature) external returns (bool)',
		];

		const relayerContract = new ethers.Contract(
			RELAYER_ADDRESS,
			relayerAbi,
			relayer
		);

		// Encode the function call to paymaster
		const paymasterInterface = new ethers.Interface([
			`function ${functionName}(${params
				.map(() => 'bytes')
				.join(',')}) external`,
		]);

		// For now, we'll need to construct the data properly
		// This is a simplified version - you'll need to encode based on functionName
		const data = ethers.AbiCoder.defaultAbiCoder().encode(
			params.map(() => 'bytes'),
			params
		);

		// Execute relay
		const tx = await relayerContract.executeRelay(
			userAddress,
			data,
			deadline,
			signature
		);

		const receipt = await tx.wait();

		return NextResponse.json({
			success: true,
			transactionHash: receipt.hash,
			receipt,
		});
	} catch (error: any) {
		console.error('Relayer error:', error);
		return NextResponse.json(
			{
				error: error.message || 'Failed to relay transaction',
				details: error.reason || error.data?.message,
			},
			{ status: 500 }
		);
	}
}
