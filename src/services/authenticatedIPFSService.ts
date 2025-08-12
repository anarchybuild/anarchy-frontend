
import { supabase } from "@/integrations/supabase/client";
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
      console.log(`🔄 Upload attempt ${attempt}/${maxRetries}`);
      return await uploadFn();
    } catch (error) {
      console.warn(`❌ Upload attempt ${attempt} failed:`, error);
      
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

// Convert file to base64 for transmission
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64 data
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Call the authenticated upload edge function
const callAuthenticatedUpload = async (fileData: string, fileName: string, fileType: string): Promise<string> => {
  console.log("📤 Calling authenticated IPFS upload edge function...");
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('authenticated-upload', {
    body: {
      fileData,
      fileName,
      fileType
    }
  });

  if (error) {
    console.error("❌ Edge function error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  if (!data || !data.success) {
    throw new Error('Upload failed: No valid response from edge function');
  }

  console.log("✅ Authenticated upload successful:", data.uri);
  return data.uri;
};

export const uploadImageToAuthenticatedIPFS = async (imageUrl: string, imageName: string): Promise<string> => {
  console.log("🖼️ Starting authenticated image upload to IPFS...");
  console.log("Image URL type:", imageUrl.startsWith('data:') ? 'Base64' : 'External URL');
  
  // If the image is already an external URL, validate and use it
  if (!imageUrl.startsWith('data:')) {
    console.log("✅ Using external image URL:", imageUrl);
    return imageUrl;
  }

  try {
    const imageFile = dataURLToFile(imageUrl, `${imageName.replace(/\s+/g, '_')}.png`);
    console.log("📁 Image file created:", imageFile.name, `${(imageFile.size / 1024).toFixed(2)} KB`);
    
    const base64Data = await fileToBase64(imageFile);
    
    const uploadWithRetry = () => withTimeout(
      callAuthenticatedUpload(base64Data, imageFile.name, imageFile.type),
      30000 // 30 second timeout for images
    );
    
    const uploadResult = await retryUpload(uploadWithRetry, 3, 2000);
    console.log("🔗 Authenticated image upload completed:", uploadResult);
    
    return uploadResult;
    
  } catch (error) {
    console.error("❌ Authenticated image IPFS upload failed:", error);
    throw new Error(`Failed to upload image to IPFS with authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const uploadMetadataToAuthenticatedIPFS = async (metadata: NFTMetadata): Promise<string> => {
  console.log("📄 Starting authenticated metadata upload to IPFS...");
  
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
    
    const base64Data = await fileToBase64(metadataFile);
    
    const uploadWithRetry = () => withTimeout(
      callAuthenticatedUpload(base64Data, metadataFile.name, metadataFile.type),
      30000 // 30 second timeout for metadata
    );
    
    const uploadResult = await retryUpload(uploadWithRetry, 3, 2000);
    console.log("🔗 Authenticated metadata upload completed:", uploadResult);
    
    return uploadResult;
    
  } catch (error) {
    console.error("❌ Authenticated metadata IPFS upload failed:", error);
    throw new Error(`Failed to upload metadata to IPFS with authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
