
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

// Helper function to retry uploads
const retryUpload = async <T>(
  uploadFn: () => Promise<T>, 
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries}`);
      return await uploadFn();
    } catch (error) {
      console.warn(`Upload attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw new Error('Max retries exceeded');
};

export const uploadImageToIPFS = async (imageUrl: string, imageName: string): Promise<string> => {
  console.log("🖼️ Starting image upload to IPFS...");
  
  // If the image is already a URL (not base64), use it directly
  if (!imageUrl.startsWith('data:')) {
    console.log("Image URL is already external, using as-is:", imageUrl);
    return imageUrl;
  }

  try {
    const imageFile = dataURLToFile(imageUrl, `${imageName.replace(/\s+/g, '_')}.png`);
    console.log("Image file created:", imageFile.name, imageFile.size);
    
    const uploadWithRetry = () => withTimeout(
      upload({
        client,
        files: [imageFile],
      }),
      15000 // 15 second timeout
    );
    
    const uploadResult = await retryUpload(uploadWithRetry, 3, 2000);
    console.log("✅ Image upload successful:", uploadResult);
    
    // Ensure we return a proper IPFS URI
    if (typeof uploadResult === 'string') {
      if (uploadResult.startsWith('ipfs://')) {
        return uploadResult;
      } else if (uploadResult.includes('ipfs') || uploadResult.includes('gateway')) {
        // Extract hash from gateway URL and convert to ipfs:// format
        const hashMatch = uploadResult.match(/(?:ipfs\/|\/ipfs\/)([a-zA-Z0-9]+)/);
        if (hashMatch) {
          const ipfsUri = `ipfs://${hashMatch[1]}`;
          console.log("Converted to IPFS URI:", ipfsUri);
          return ipfsUri;
        }
      }
      // If it's a direct URL from thirdweb, use it as-is
      console.log("Using thirdweb storage URL:", uploadResult);
      return uploadResult;
    }
    
    throw new Error("Invalid upload result format");
    
  } catch (error) {
    console.error("❌ Image IPFS upload failed:", error);
    throw new Error(`Failed to upload image to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const uploadMetadataToIPFS = async (metadata: NFTMetadata): Promise<string> => {
  console.log("📄 Starting metadata upload to IPFS...");
  
  try {
    // Create clean, minimal metadata for better compatibility
    const cleanMetadata = {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      external_url: metadata.external_url || "https://anarchy-platform.com",
      attributes: metadata.attributes || []
    };
    
    console.log("Clean metadata prepared:", cleanMetadata);
    
    const metadataFile = createMetadataFile(
      cleanMetadata, 
      `${metadata.name.replace(/\s+/g, '_')}_metadata.json`
    );
    
    console.log("Metadata file created:", metadataFile.name, metadataFile.size);
    
    const uploadWithRetry = () => withTimeout(
      upload({
        client,
        files: [metadataFile],
      }),
      15000 // 15 second timeout
    );
    
    const uploadResult = await retryUpload(uploadWithRetry, 3, 2000);
    console.log("✅ Metadata upload successful:", uploadResult);
    
    // Ensure we return a proper IPFS URI
    if (typeof uploadResult === 'string') {
      if (uploadResult.startsWith('ipfs://')) {
        return uploadResult;
      } else if (uploadResult.includes('ipfs') || uploadResult.includes('gateway')) {
        // Extract hash from gateway URL and convert to ipfs:// format
        const hashMatch = uploadResult.match(/(?:ipfs\/|\/ipfs\/)([a-zA-Z0-9]+)/);
        if (hashMatch) {
          const ipfsUri = `ipfs://${hashMatch[1]}`;
          console.log("Converted to IPFS URI:", ipfsUri);
          return ipfsUri;
        }
      }
      // If it's a direct URL from thirdweb, use it as-is
      console.log("Using thirdweb storage URL:", uploadResult);
      return uploadResult;
    }
    
    throw new Error("Invalid metadata upload result format");
    
  } catch (error) {
    console.error("❌ Metadata IPFS upload failed:", error);
    throw new Error(`Failed to upload metadata to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
