import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Replicate API key from environment
    const replicateApiKey = Deno.env.get('REPLICATE_API_TOKEN')
    
    console.log('API key test:')
    console.log('- REPLICATE_API_TOKEN exists:', !!replicateApiKey)
    console.log('- Key format valid:', replicateApiKey?.startsWith('r8_'))
    console.log('- Key length:', replicateApiKey?.length || 0)
    
    if (!replicateApiKey) {
      throw new Error('Replicate API key not configured in Supabase environment')
    }

    if (!replicateApiKey.startsWith('r8_')) {
      throw new Error('Invalid Replicate API key format. Keys should start with "r8_"')
    }

    // Test the API key by making a simple request to Replicate
    const response = await fetch('https://api.replicate.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${replicateApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('Replicate API test response:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Replicate API error:', response.status, errorText)
      throw new Error(`Replicate API error: ${response.status}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Replicate API key is valid',
        models_count: data.results?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error in api-test function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})