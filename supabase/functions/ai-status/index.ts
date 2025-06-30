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
    const url = new URL(req.url)
    const predictionId = url.searchParams.get('id')

    if (!predictionId) {
      throw new Error('Prediction ID is required')
    }

    // Get Replicate API key from environment
    const replicateApiKey = Deno.env.get('REPLICATE_API_TOKEN')
    
    console.log('Status check environment:')
    console.log('- REPLICATE_API_TOKEN exists:', !!replicateApiKey)
    console.log('- Key format valid:', replicateApiKey?.startsWith('r8_'))
    console.log('- Key length:', replicateApiKey?.length || 0)
    console.log('- Checking prediction:', predictionId)
    
    if (!replicateApiKey) {
      console.error('❌ Replicate API key not found in environment variables')
      throw new Error('Replicate API key not configured in Supabase environment. Please add REPLICATE_API_TOKEN to your Supabase project secrets.')
    }

    if (!replicateApiKey.startsWith('r8_')) {
      console.error('❌ Invalid Replicate API key format')
      throw new Error('Invalid Replicate API key format. Keys should start with "r8_"')
    }

    // Special case for test ID
    if (predictionId === 'test') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'API connection test successful',
          status: 'test'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    console.log('Checking status for prediction:', predictionId)

    // Make request to Replicate
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${replicateApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('Replicate status API response:', response.status)
    console.log('Replicate API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Replicate API error:', response.status, errorText)
      
      let userFriendlyError = 'Failed to check AI transformation status'
      
      if (response.status === 401) {
        userFriendlyError = 'Invalid Replicate API key'
      } else if (response.status === 404) {
        userFriendlyError = 'AI transformation not found'
      } else if (response.status >= 500) {
        userFriendlyError = 'Replicate service temporarily unavailable'
      }
      
      throw new Error(`${userFriendlyError} (Status: ${response.status})`)
    }

    const prediction = await response.json()
    console.log('✅ Prediction status retrieved:', prediction.status)

    return new Response(
      JSON.stringify({
        success: true,
        id: prediction.id,
        status: prediction.status,
        output: prediction.output,
        error: prediction.error,
        logs: prediction.logs,
        created_at: prediction.created_at,
        started_at: prediction.started_at,
        completed_at: prediction.completed_at
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error in ai-status function:', error)
    
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