import { prepareContractCall, sendTransaction } from "thirdweb";
import { TransactionResult, AllowlistProof } from "@/types/thirdweb";
import { getContractInstance, CONFIG } from "@/config/thirdweb";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const prepareAndSendClaimTransaction = async (
  account: any,
  metadataUri: string,
  quantity: number = 1,
  pricePerToken: string = "0"
): Promise<TransactionResult> => {
  console.log("=== Starting Claim Transaction Preparation ===");
  console.log("Account address:", account.address);
  console.log("Metadata URI:", metadataUri);
  console.log("Quantity:", quantity);
  console.log("Price per token:", pricePerToken);
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
    
    console.log("🔍 Step 3: Preparing claim parameters...");
    
    // Create empty allowlist proof for public claims
    const allowlistProof: AllowlistProof = {
      proof: [],
      quantityLimitPerWallet: "0",
      pricePerToken: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
      currency: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    };
    
    console.log("🔍 Step 4: Preparing contract call with claim function...");
    
    // Use the claim function signature with MethodID 0x84bb1e42
    const transaction = await prepareContractCall({
      contract,
      method: "function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data) public payable",
      params: [
        account.address, // _receiver
        BigInt(quantity), // _quantity
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as `0x${string}`, // _currency
        BigInt(pricePerToken), // _pricePerToken
        {
          proof: allowlistProof.proof as readonly `0x${string}`[], // proof array
          quantityLimitPerWallet: BigInt(allowlistProof.quantityLimitPerWallet), // quantityLimitPerWallet
          pricePerToken: BigInt(allowlistProof.pricePerToken), // pricePerToken
          currency: allowlistProof.currency as `0x${string}` // currency
        }, // _allowlistProof
        "0x" as `0x${string}` // _data (empty data)
      ],
    });

    console.log("🔍 Step 5: Setting gas limit...");
    
    // Set default gas limit
    const defaultGasLimit = BigInt(30000000);
    console.log("Using default gas limit:", defaultGasLimit.toString());

    // Prepare the final transaction with the specified gas limit and MethodID 0x84bb1e42
    const finalTransaction = await prepareContractCall({
      contract,
      method: "function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data) public payable",
      params: [
        account.address,
        BigInt(quantity),
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as `0x${string}`,
        BigInt(pricePerToken),
        {
          proof: allowlistProof.proof as readonly `0x${string}`[],
          quantityLimitPerWallet: BigInt(allowlistProof.quantityLimitPerWallet),
          pricePerToken: BigInt(allowlistProof.pricePerToken),
          currency: allowlistProof.currency as `0x${string}`
        },
        "0x" as `0x${string}`
      ],
      gas: defaultGasLimit,
    });

    console.log("✅ Transaction prepared with parameters:");
    console.log("- Receiver address:", account.address);
    console.log("- Quantity:", quantity);
    console.log("- Currency:", "Native GLMR");
    console.log("- Price per token:", pricePerToken);
    console.log("- Allowlist proof:", "Empty (public claim)");
    console.log("- Data:", cleanMetadataUri);
    console.log("- Gas limit:", defaultGasLimit.toString());
    
    console.log("🔍 Step 6: Sending transaction...");

    const result = await sendTransaction({
      transaction: finalTransaction,
      account
    });

    console.log("🎉 Claim transaction sent successfully!");
    console.log("Transaction hash:", result.transactionHash);
    
    return { 
      transactionHash: result.transactionHash, 
      contractAddress: contract.address
    };
    
  } catch (error: any) {
    console.error(`💥 Claim transaction failed:`, error);
    
    // Enhanced error handling for claim-specific errors
    if (error.message?.includes("user rejected") || error.code === 4001) {
      throw new Error("Transaction was rejected by user in wallet.");
    }
    
    if (error.message?.includes("insufficient funds") || error.code === -32000) {
      throw new Error("Insufficient GLMR tokens for gas fees. Please add more GLMR tokens to your wallet.");
    }
    
    if (error.message?.includes("execution reverted")) {
      throw new Error("Smart contract execution reverted. This might be due to claim conditions not being met, invalid allowlist proof, or insufficient payment.");
    }
    
    if (error.message?.includes("method not found") || error.message?.includes("invalid method")) {
      throw new Error("Contract method not found. Please verify the contract has the correct claim function.");
    }
    
    if (error.message?.includes("gas required exceeds allowance") || 
        error.message?.includes("out of gas")) {
      throw new Error("Transaction requires more gas. Please manually set gas limit to 1,000,000 in MetaMask.");
    }
    
    if (error.message?.includes("nonce")) {
      throw new Error("Transaction nonce issue. Please reset your MetaMask account or try again.");
    }
    
    throw new Error(`Claim transaction failed: ${error.message || 'Unknown error'}. Please verify the contract method and try again.`);
  }
};

export const handleClaimError = (error: any): never => {
  console.error("🔥 Error in claimNFT:", error);
  
  if (error.message.includes("Network connection issue")) {
    throw new Error("MetaMask is experiencing network connectivity issues. Please refresh the page and try again.");
  } else if (error.message.includes("Smart contract rejected")) {
    throw new Error("The NFT contract rejected the claim request. The contract might be paused or claim conditions not met.");
  } else if (error.message.includes("insufficient funds")) {
    throw new Error("Insufficient GLMR tokens for transaction fees. Please get more GLMR tokens for your wallet.");
  } else if (error.message.includes("user rejected")) {
    throw new Error("Transaction was rejected by user in wallet.");
  } else {
    throw new Error(`Claiming failed: ${error.message}. Please refresh the page and try again.`);
  }
};