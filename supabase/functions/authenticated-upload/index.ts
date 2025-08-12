
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { fileData, fileName, fileType } = await req.json()

    // Get thirdweb secret key from Supabase secrets
    const thirdwebSecretKey = Deno.env.get('THIRDWEB_SECRET_KEY')
    if (!thirdwebSecretKey) {
      throw new Error('Thirdweb secret key not configured')
    }

    console.log('📤 Uploading to thirdweb with authenticated client...')
    console.log('File name:', fileName)
    console.log('File type:', fileType)
    console.log('File size (base64):', fileData.length, 'characters')

    // Convert base64 back to file format for thirdweb
    const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0))
    const blob = new Blob([binaryData], { type: fileType })

    // Create form data for thirdweb upload
    const formData = new FormData()
    formData.append('file', blob, fileName)

    // Upload to thirdweb storage using their direct API
    const thirdwebResponse = await fetch('https://storage.thirdweb.com/ipfs/upload', {
      method: 'POST',
      headers: {
        'x-secret-key': thirdwebSecretKey,
      },
      body: formData
    })

    if (!thirdwebResponse.ok) {
      const errorText = await thirdwebResponse.text()
      console.error('Thirdweb upload failed:', thirdwebResponse.status, errorText)
      throw new Error(`Thirdweb upload failed: ${thirdwebResponse.status} ${errorText}`)
    }

    const uploadResult = await thirdwebResponse.json()
    console.log('✅ Thirdweb upload successful:', uploadResult)

    // Extract the IPFS hash from the response
    const ipfsHash = uploadResult.IpfsHash || uploadResult.ipfsHash || uploadResult.Hash
    const ipfsUri = ipfsHash ? `ipfs://${ipfsHash}` : uploadResult.uri || uploadResult.url
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        uri: ipfsUri,
        ipfsHash: ipfsHash,
        gatewayUrl: uploadResult.PinataURL || uploadResult.url || `https://gateway.thirdweb.com/ipfs/${ipfsHash}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
