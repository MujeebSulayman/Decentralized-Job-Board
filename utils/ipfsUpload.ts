import axios from 'axios';

/**
 * Validate file before upload
 * @param file File to validate
 * @param maxSizeInMB Maximum file size in MB
 * @returns Boolean indicating if file is valid
 */
export const validateFileForUpload = (
	file: File,
	maxSizeInMB: number = 5
): boolean => {
	const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

	// Check file size
	if (file.size > maxSizeInBytes) {
		throw new Error(`File must be smaller than ${maxSizeInMB}MB`);
	}

	// Check file type (optional: add more allowed types)
	const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
	if (!allowedTypes.includes(file.type)) {
		throw new Error('Unsupported file type. Please upload an image.');
	}

	return true;
};

/**
 * Upload file to IPFS using Pinata
 * @param file File to upload
 * @returns Object containing IPFS URL and CID
 */
export const uploadToIPFS = async (
	file: File
): Promise<{
	ipfsUrl: string;
	cid: string;
}> => {
	// Validate inputs
	if (!file) {
		throw new Error('No file provided');
	}

	// Validate file size and type
	validateFileForUpload(file);

	// Create form data
	const formData = new FormData();
	formData.append('file', file, file.name);

	try {
		const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
		const pinataSecretApiKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;

		if (!pinataApiKey || !pinataSecretApiKey) {
			throw new Error('Pinata API credentials are missing');
		}

		const response = await axios.post(
			'https://api.pinata.cloud/pinning/pinFileToIPFS',
			formData,
			{
				maxBodyLength: Infinity,
				headers: {
					'Content-Type': 'multipart/form-data',
					pinata_api_key: pinataApiKey,
					pinata_secret_api_key: pinataSecretApiKey,
				},
			}
		);

		const { IpfsHash } = response.data;

		return {
			ipfsUrl: `https://gateway.pinata.cloud/ipfs/${IpfsHash}`,
			cid: IpfsHash,
		};
	} catch (error) {
		console.error('IPFS Upload Error:', error);

		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.error?.details || 'Failed to upload file to IPFS'
			);
		}

		throw new Error('Unknown IPFS upload error');
	}
};

/**
 * Generate IPFS gateway URL for a given CID
 * @param cid Content Identifier
 * @returns Full IPFS gateway URL
 */
export const getIPFSGatewayUrl = (cid: string): string => {
	return `https://gateway.pinata.cloud/ipfs/${cid}`;
};
