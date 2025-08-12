
import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";

// Create the client with your clientId for public operations
export const client = createThirdwebClient({
  clientId: "b7341d6037bd9a081b3c45a0d89b20c9",
});

// For authenticated operations, we'll use the Supabase Edge Function
// which has access to the secret key securely stored in Supabase secrets

// Define Moonbeam mainnet chain with comprehensive configuration
export const moonbeam = defineChain({
  id: 1284,
  name: "Moonbeam",
  nativeCurrency: {
    name: "GLMR",
    symbol: "GLMR",
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: "Moonscan",
      url: "https://moonscan.io",
      apiUrl: "https://api-moonscan.io/api",
    },
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.api.moonbeam.network"],
    },
  },
  testnet: false,
});

// Contract address validation
const CONTRACT_ADDRESS = "0x6A6BFa3b50255Bc50b64d6b29264c10b5d33d0D5";

const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Connect to your contract with enhanced error handling
export const getContractInstance = () => {
  try {
    if (!isValidAddress(CONTRACT_ADDRESS)) {
      throw new Error(`Invalid contract address format: ${CONTRACT_ADDRESS}`);
    }

    console.log("Initializing contract with address:", CONTRACT_ADDRESS);
    console.log("Chain ID:", moonbeam.id);

    const contractInstance = getContract({
      client,
      chain: moonbeam,
      address: CONTRACT_ADDRESS,
    });

    console.log("✅ Contract instance created successfully");
    return contractInstance;
    
  } catch (error) {
    console.error("❌ Failed to initialize contract:", error);
    throw new Error(`Contract initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Export the contract instance with lazy initialization
let contractInstance: ReturnType<typeof getContract> | null = null;

export const contract = (() => {
  if (!contractInstance) {
    contractInstance = getContractInstance();
  }
  return contractInstance;
})();

// Export configuration constants
export const CONFIG = {
  CLIENT_ID: "b7341d6037bd9a081b3c45a0d89b20c9",
  CONTRACT_ADDRESS,
  CHAIN_ID: moonbeam.id,
  CHAIN_NAME: moonbeam.name,
  RPC_URL: "https://rpc.api.moonbeam.network",
} as const;
