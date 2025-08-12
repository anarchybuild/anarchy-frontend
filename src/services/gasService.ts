import { prepareContractCall, sendTransaction, estimateGas } from "thirdweb";
import { TransactionResult } from "@/types/thirdweb";
import { getContractInstance, CONFIG } from "@/config/thirdweb";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const prepareAndSendTransaction = async (
  account: any,
  metadataUri: string
): Promise<TransactionResult> => {
  console.log("=== Starting Transaction Preparation ===");
  console.log("Account address:", account.address);
  console.log("Metadata URI:", metadataUri);
  console.log("Contract address:", CONFIG.CONTRACT_ADDRESS);
  console.log("Chain ID:", CONFIG.CHAIN_ID);
  
  // Validate metadata URI format
  if (!metadataUri || metadataUri.trim() === '') {
    throw new Error("Invalid metadata URI provided");
  }
  
  // Clean the metadata URI to ensure it's properly formatted
  const cleanMetadataUri = metadataUri.trim();
  console.log("Clean metadata URI:", cleanMetadataUri);
  
  // Add delay to prevent overwhelming MetaMask
  await sleep(2000);
  
  try {
    console.log("🔍 Step 1: Validating account...");
    
    if (!account || !account.address) {
      throw new Error("Account is not properly connected");
    }
    
    console.log("✅ Account validated");
    
    console.log("🔍 Step 2: Getting contract instance...");
    const contract = getContractInstance();
    console.log("Contract address:", contract.address);
    console.log("Chain ID:", contract.chain?.id);
    
    console.log("🔍 Step 3: Preparing contract call with mint function...");
    
    // Use the actual contract mint function signature
    const transaction = await prepareContractCall({
      contract,
      method: "function mint(address to, uint256 amount, string calldata baseURI, bytes calldata data) external payable",
      params: [account.address, BigInt(1), cleanMetadataUri, "0x"],
    });

    console.log("🔍 Step 4: Setting gas limit...");
    
    // Set default gas limit to 30,000,000 as requested
    const defaultGasLimit = BigInt(30000000);
    console.log("Using default gas limit:", defaultGasLimit.toString());

    // Prepare the final transaction with the specified gas limit
    const finalTransaction = await prepareContractCall({
      contract,
      method: "function mint(address to, uint256 amount, string calldata baseURI, bytes calldata data) external payable",
      params: [account.address, BigInt(1), cleanMetadataUri, "0x"],
      gas: defaultGasLimit,
    });

    console.log("✅ Transaction prepared with parameters:");
    console.log("- To address:", account.address);
    console.log("- Amount:", "1");
    console.log("- Base URI:", cleanMetadataUri);
    console.log("- Data:", "0x");
    console.log("- Gas limit:", defaultGasLimit.toString());
    
    console.log("🔍 Step 5: Sending transaction...");

    const result = await sendTransaction({
      transaction: finalTransaction,
      account
    });

    console.log("🎉 Transaction sent successfully!");
    console.log("Transaction hash:", result.transactionHash);
    
    return { 
      transactionHash: result.transactionHash, 
      contractAddress: contract.address
    };
    
  } catch (error: any) {
    console.error(`💥 Transaction failed:`, error);
    
    // Enhanced error handling with method-specific errors
    if (error.message?.includes("user rejected") || error.code === 4001) {
      throw new Error("Transaction was rejected by user in wallet.");
    }
    
    if (error.message?.includes("insufficient funds") || error.code === -32000) {
      throw new Error("Insufficient GLMR tokens for gas fees. Please add more GLMR tokens to your wallet.");
    }
    
    if (error.message?.includes("execution reverted")) {
      throw new Error("Smart contract execution reverted. This might be due to invalid metadata URI format, incorrect method signature, or contract permissions. Please verify the contract method and parameters.");
    }
    
    if (error.message?.includes("method not found") || error.message?.includes("invalid method")) {
      throw new Error("Contract method not found. Please verify the contract has the correct mint function with method ID 0xd2b04fd6.");
    }
    
    if (error.message?.includes("gas required exceeds allowance") || 
        error.message?.includes("out of gas")) {
      throw new Error("Transaction requires more gas. Please manually set gas limit to 1,000,000 in MetaMask.");
    }
    
    if (error.message?.includes("nonce")) {
      throw new Error("Transaction nonce issue. Please reset your MetaMask account or try again.");
    }
    
    throw new Error(`Transaction failed: ${error.message || 'Unknown error'}. Please verify the contract method and try again.`);
  }
};

export const handleMintingError = (error: any): never => {
  console.error("🔥 Error in mintNFTWithThirdweb:", error);
  
  if (error.message.includes("Network connection issue")) {
    throw new Error("MetaMask is experiencing network connectivity issues. Please refresh the page and try again.");
  } else if (error.message.includes("Smart contract rejected")) {
    throw new Error("The NFT contract rejected the minting request. The contract might be paused or you may not have permission to mint.");
  } else if (error.message.includes("insufficient funds")) {
    throw new Error("Insufficient GLMR tokens for transaction fees. Please get more GLMR tokens for your wallet.");
  } else if (error.message.includes("user rejected")) {
    throw new Error("Transaction was rejected by user in wallet.");
  } else {
    throw new Error(`Minting failed: ${error.message}. Please refresh the page and try again.`);
  }
};
