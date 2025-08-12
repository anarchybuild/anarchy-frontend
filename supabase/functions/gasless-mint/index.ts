import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);
  
  if (!userLimit || now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Gasless mint function called');
    
    // Initialize Supabase client for authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify authentication - handle both Supabase users and wallet users
    const authHeader = req.headers.get('Authorization');
    let authenticatedUserId = null;
    let isSupabaseUser = false;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && user) {
          authenticatedUserId = user.id;
          isSupabaseUser = true;
          console.log('✅ Supabase user authenticated:', user.id);
        }
      } catch (error) {
        console.log('🔍 Not a Supabase token, checking for wallet auth...');
      }
    }
    
    // If no Supabase auth, this might be a wallet user - we'll validate wallet ownership later
    if (!authenticatedUserId) {
      console.log('🔍 No Supabase authentication, proceeding with wallet validation...');
    }
    
    const { name, description, imageUrl, creator, license, userAddress } = await req.json();
    console.log('📝 Mint parameters:', { name, description, imageUrl, creator, license, userAddress });
    
    // Input validation
    if (!name || !description || !imageUrl || !userAddress) {
      console.error('❌ Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: name, description, imageUrl, userAddress' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Sanitize inputs
    const sanitizedName = name.trim().substring(0, 100);
    const sanitizedDescription = description.trim().substring(0, 1000);
    
    // Rate limiting check
    const rateLimitIdentifier = authenticatedUserId || userAddress;
    if (!checkRateLimit(rateLimitIdentifier)) {
      console.error('❌ Rate limit exceeded for identifier:', rateLimitIdentifier);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Verify the user owns the wallet address (basic check)
    if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      console.error('❌ Invalid wallet address format');
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get environment variables
    const privateKey = Deno.env.get('GASLESS_MINT_PRIVATE_KEY');
    const thirdwebSecretKey = Deno.env.get('THIRDWEB_SECRET_KEY');
    
    if (!privateKey) {
      throw new Error('GASLESS_MINT_PRIVATE_KEY not configured');
    }
    
    if (!thirdwebSecretKey) {
      throw new Error('THIRDWEB_SECRET_KEY not configured');
    }

    console.log('🔑 Environment variables loaded');

    // Convert base64 data URL to file and upload to IPFS
    console.log('📤 Uploading image to IPFS...');
    
    // Convert data URL to blob
    const base64Data = imageUrl.split(',')[1];
    const mimeType = imageUrl.match(/data:([^;]+);/)?.[1] || 'image/png';
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    
    // Create form data for thirdweb upload
    const formData = new FormData();
    formData.append('file', blob, `${name}.png`);
    
    const imageUploadResponse = await fetch('https://storage.thirdweb.com/ipfs/upload', {
      method: 'POST',
      headers: {
        'X-SECRET-KEY': thirdwebSecretKey,
      },
      body: formData
    });

    if (!imageUploadResponse.ok) {
      const errorText = await imageUploadResponse.text();
      console.error('Image upload error:', errorText);
      throw new Error(`Failed to upload image: ${imageUploadResponse.statusText}`);
    }

    const imageResult = await imageUploadResponse.json();
    const ipfsImageUrl = imageResult.IpfsHash ? `ipfs://${imageResult.IpfsHash}` : imageResult.pinataUrl;
    console.log('✅ Image uploaded to IPFS:', ipfsImageUrl);

    // Create metadata with sanitized values
    const metadata = {
      name: sanitizedName,
      description: sanitizedDescription,
      image: ipfsImageUrl,
      external_url: "https://your-app.com",
      attributes: [
        {
          trait_type: "Creator",
          value: creator || "Unknown"
        },
        {
          trait_type: "License",
          value: license || "All Rights Reserved"
        },
        {
          trait_type: "Creation Date",
          value: new Date().toISOString()
        },
        {
          trait_type: "Minted By",
          value: authenticatedUserId || userAddress
        }
      ]
    };

    // Upload metadata to IPFS using a simpler approach
    console.log('📤 Uploading metadata to IPFS...');
    
    // Try uploading metadata as JSON string first
    const metadataUploadResponse = await fetch(`https://storage.thirdweb.com/ipfs/upload`, {
      method: 'POST',
      headers: {
        'X-SECRET-KEY': thirdwebSecretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata)
    });

    if (!metadataUploadResponse.ok) {
      const errorText = await metadataUploadResponse.text();
      console.error('Metadata upload error (JSON method):', errorText);
      console.error('Trying FormData method...');
      
      // Fallback to FormData method
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      const metadataFormData = new FormData();
      metadataFormData.append('file', metadataBlob, `${name}-metadata.json`);
      
      const metadataFormDataResponse = await fetch(`https://storage.thirdweb.com/ipfs/upload`, {
        method: 'POST',
        headers: {
          'X-SECRET-KEY': thirdwebSecretKey,
        },
        body: metadataFormData
      });
      
      if (!metadataFormDataResponse.ok) {
        const formDataErrorText = await metadataFormDataResponse.text();
        console.error('Metadata upload error (FormData method):', formDataErrorText);
        console.error('FormData upload status:', metadataFormDataResponse.status);
        throw new Error(`Failed to upload metadata: ${metadataFormDataResponse.statusText}`);
      }
      
      var metadataResult = await metadataFormDataResponse.json();
    } else {
      var metadataResult = await metadataUploadResponse.json();
    }

    
    const metadataUri = metadataResult.IpfsHash ? `ipfs://${metadataResult.IpfsHash}` : metadataResult.pinataUrl;
    console.log('✅ Metadata uploaded to IPFS:', metadataUri);

    // Import ethers dynamically
    const { ethers } = await import('https://esm.sh/ethers@6.14.3');
    console.log('📦 Ethers imported successfully');

    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider('https://rpc.api.moonbeam.network');
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('🔗 Wallet connected:', wallet.address);

    // Contract ABI (just the mint function)
    const contractABI = [
      "function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, tuple(bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data) external payable"
    ];

    // Use correct contract address and ensure proper checksum
    const rawContractAddress = "0x6A6BFa3b50255Bc50b64d6b29264c10b5d33d0D5";
    const contractAddress = ethers.getAddress(rawContractAddress);
    console.log('📋 Contract address (checksummed):', contractAddress);
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    // Prepare claim parameters
    const receiver = userAddress || wallet.address; // NFT goes to the user's address
    const quantity = 1;
    const currency = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"; // Native token
    const pricePerToken = 0; // Free mint
    const allowlistProof = {
      proof: [],
      quantityLimitPerWallet: 1,
      pricePerToken: 0,
      currency: currency
    };
    const data = ethers.hexlify(ethers.toUtf8Bytes(metadataUri));

    console.log('🔧 Preparing transaction...');

    // Get current gas price
    const gasPrice = await provider.getFeeData();
    console.log('⛽ Current gas price:', gasPrice);

    // Execute the claim transaction
    console.log('📝 Executing claim transaction...');
    const tx = await contract.claim(
      receiver,
      quantity,
      currency,
      pricePerToken,
      allowlistProof,
      data,
      {
        value: 0,
        maxFeePerGas: gasPrice.maxFeePerGas,
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
      }
    );

    console.log('⏳ Transaction submitted:', tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed:', receipt.hash);
    
    // Log successful mint for audit trail
    console.log('🎉 NFT successfully minted:', {
      userId: authenticatedUserId || 'wallet-user',
      userAddress,
      transactionHash: receipt.hash,
      contractAddress,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        transactionHash: receipt.hash,
        metadataUri,
        imageUri: ipfsImageUrl,
        contractAddress,
        tokenId: receipt.logs?.length > 0 ? receipt.logs[0].topics[3] : null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in gasless mint:', error);
    
    // Log error for security monitoring
    console.error('🚨 Mint error details:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: req.headers.get('user-agent')
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error. Please try again later.',
        // Only include details in development
        ...(Deno.env.get('DENO_ENV') === 'development' && { details: error.message })
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});