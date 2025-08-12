
import { upload } from "thirdweb/storage";
import { client } from "@/config/thirdweb";
import { dataURLToFile, createMetadataFile } from "@/utils/fileUtils";
import { NFTMetadata } from "@/types/thirdweb";

// Helper function to add timeout to promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout')), timeoutMs)
    )
  ]);
};

// Helper function to retry uploads with exponential backoff
const retryUpload = async <T>(
  uploadFn: () => Promise<T>, 
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Wallet upload attempt ${attempt}/${maxRetries}`);
      return await uploadFn();
    } catch (error) {
      console.warn(`❌ Wallet upload attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: wait longer between retries
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
};

export const uploadImageToWalletIPFS = async (imageUrl: string, imageName: string): Promise<string> => {
  console.log("🖼️ Starting wallet-based image upload to IPFS...");
  console.log("Image URL type:", imageUrl.startsWith('data:') ? 'Base64' : 'External URL');
  
  // If the image is already an external URL, validate and use it
  if (!imageUrl.startsWith('data:')) {
    console.log("✅ Using external image URL:", imageUrl);
    return imageUrl;
  }

  try {
    const imageFile = dataURLToFile(imageUrl, `${imageName.replace(/\s+/g, '_')}.png`);
    console.log("📁 Image file created:", imageFile.name, `${(imageFile.size / 1024).toFixed(2)} KB`);
    
    const uploadWithRetry = () => withTimeout(
      upload({
        client,
        files: [imageFile],
      }),
      30000 // 30 second timeout for images
    );
    
    const uploadResult = await retryUpload(uploadWithRetry, 3, 2000);
    console.log("🔗 Wallet image upload completed:", uploadResult);
    
    // Ensure we return a proper IPFS URI or thirdweb URL
    if (typeof uploadResult === 'string') {
      return uploadResult;
    }
    
    throw new Error("Invalid upload result format");
    
  } catch (error) {
    console.error("❌ Wallet image IPFS upload failed:", error);
    throw new Error(`Failed to upload image to IPFS with wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const uploadMetadataToWalletIPFS = async (metadata: NFTMetadata): Promise<string> => {
  console.log("📄 Starting wallet-based metadata upload to IPFS...");
  
  try {
    // Create clean, minimal metadata for better compatibility
    const cleanMetadata = {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      external_url: metadata.external_url || "https://anarchy-platform.com",
      attributes: metadata.attributes || []
    };
    
    console.log("🧹 Clean metadata prepared:", cleanMetadata);
    
    const metadataFile = createMetadataFile(
      cleanMetadata, 
      `${metadata.name.replace(/\s+/g, '_')}_metadata.json`
    );
    
    console.log("📁 Metadata file created:", metadataFile.name, `${(metadataFile.size / 1024).toFixed(2)} KB`);
    
    const uploadWithRetry = () => withTimeout(
      upload({
        client,
        files: [metadataFile],
      }),
      30000 // 30 second timeout for metadata
    );
    
    const uploadResult = await retryUpload(uploadWithRetry, 3, 2000);
    console.log("🔗 Wallet metadata upload completed:", uploadResult);
    
    // Ensure we return a proper IPFS URI or thirdweb URL
    if (typeof uploadResult === 'string') {
      return uploadResult;
    }
    
    throw new Error("Invalid metadata upload result format");
    
  } catch (error) {
    console.error("❌ Wallet metadata IPFS upload failed:", error);
    throw new Error(`Failed to upload metadata to IPFS with wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
