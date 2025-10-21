import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useActiveAccount } from 'thirdweb/react';
import { createDesign } from '@/services/designService';
import { useNFTMinting } from '@/hooks/useNFTMinting';
import { uploadGeneratedImages } from '@/services/generatedImageService';

interface UseImageGenerationOptions {
  model?: string;
  width?: number;
  height?: number;
  isPrivate?: boolean;
  seriesId?: string | null;
}

interface GenerateAndMintParams {
  prompt: string;
  name?: string;
  description?: string;
  options?: UseImageGenerationOptions;
}

export const useImageGeneration = () => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const account = useActiveAccount();
  const { claimNFT } = useNFTMinting();

  const generateAndMint = async ({ prompt, name, description, options = {} }: GenerateAndMintParams) => {
    console.log("🎯 generateAndMint called", { 
      prompt,
      name,
      description,
      hasAccount: !!account, 
      accountAddress: account?.address,
      options
    });

    if (!prompt.trim()) {
      console.log("❌ No prompt provided");
      toast({
        title: "Missing prompt",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive"
      });
      return null;
    }

    if (!account) {
      toast({
        title: "Sign in to generate",
        description: "Please connect your wallet to generate images.",
        variant: "destructive"
      });
      return null;
    }

    const {
      model = 'flux',
      width = 1024,
      height = 1024,
      isPrivate = false,
      seriesId = null
    } = options;

    console.log("🔄 Starting image generation and minting process...");
    setGenerating(true);
    
    try {
      console.log("📸 Generating image with prompt:", prompt);
      
      // Generate the image with optimized sizes
      const response = await fetch('https://kzkdzvavqjdtomeqwlxn.supabase.co/functions/v1/generate-optimized-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6a2R6dmF2cWpkdG9tZXF3bHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4OTY4NDgsImV4cCI6MjA1MjQ3Mjg0OH0.Y-h2taL-CQaF1WkOP_Dh9_ArOZH0CQTXgx-IpsvnGzg`
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          width,
          height
        })
      });
      
      const data = await response.json();
      console.log("📸 Image generation response:", { success: data.success, hasImageUrl: !!data.imageUrl, error: data.error });
      
      if (data.success && data.imageUrl) {
        console.log("✅ Image generated successfully, processing optimized sizes...");
        
        // Process image sizes for optimization
        const { processImageSizes } = await import('@/services/imageOptimizationService');
        const processedImages = await processImageSizes(data.imageUrl);
        
        console.log('📸 Image sizes processed:', {
          originalSize: `${Math.round(processedImages.original.length / 1024)}kb`,
          thumbnailSize: `${Math.round(processedImages.thumbnail.length / 1024)}kb`,
          mediumSize: `${Math.round(processedImages.medium.length / 1024)}kb`
        });

        // Upload images to Supabase Storage
        console.log('☁️ Uploading images to storage...');
        const designName = name?.trim() || 'Generated Design';
        const designDescription = description?.trim() || prompt.trim();
        const imageName = `${designName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
        
        const uploadResult = await uploadGeneratedImages(
          processedImages.original,
          processedImages.thumbnail,
          processedImages.medium,
          account.address,
          imageName
        );

        console.log("💾 Creating design with storage URLs...");

        const designData = {
          name: designName,
          description: designDescription,
          image_url: uploadResult.originalUrl,
          thumbnail_url: uploadResult.thumbnailUrl,
          medium_url: uploadResult.mediumUrl,
          price: null,
          license: null,
          private: isPrivate,
          series_id: seriesId
        };
        
        let createdDesign = null;
        try {
          createdDesign = await createDesign(designData, account.address);
          console.log("✅ Design created successfully:", createdDesign);
        } catch (designError) {
          console.error("❌ Design creation failed:", designError);
        }

        // CRITICAL: Mint as NFT - this should ALWAYS happen
        console.log("🚀 Starting NFT minting process...");
        console.log("🔍 Minting params:", {
          name: designName,
          description: designDescription,
          imageUrl: data.imageUrl,
          creator: account.address,
          accountConnected: !!account,
        });

        try {
          const mintResult = await claimNFT({
            name: designName,
            description: designDescription,
            imageUrl: data.imageUrl,
            creator: account.address
          });
          
          console.log("✅ NFT minted successfully:", mintResult);
          

          return {
            success: true,
            imageUrl: uploadResult.originalUrl, // Return storage URL instead of data URL
            design: createdDesign,
            nft: mintResult
          };
        } catch (mintError) {
          console.error("❌ NFT minting failed:", mintError);
          toast({
            title: "Minting failed",
            description: "Image and design created, but NFT minting failed. Please try again.",
            variant: "destructive"
          });
          
          return {
            success: false,
            imageUrl: uploadResult.originalUrl, // Return storage URL instead of data URL
            error: mintError
          };
        }
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('❌ Generation process failed:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate image. Please try again.",
        variant: "destructive"
      });
      return {
        success: false,
        error
      };
    } finally {
      setGenerating(false);
    }
  };

  return {
    generateAndMint,
    generating
  };
};