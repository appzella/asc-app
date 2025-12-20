import { NextRequest } from 'next/server'

/**
 * API Route zum Abrufen von Google Places Details
 * GET /api/places/details?place_id=...
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const placeId = searchParams.get('place_id')

  if (!placeId) {
    return Response.json(
      { error: 'place_id parameter is required' },
      { status: 400 }
    )
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return Response.json(
      { error: 'Google Places API key not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=address_components&language=de`
    )

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`)
    }

    const data = await response.json()

    // Google Places API gibt Fehler in error_message zurück
    if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST' || data.error_message) {
      console.error('Google Places API error:', data.error_message || data.status)
      return Response.json(
        { 
          error: data.error_message || data.status || 'Invalid request',
          status: data.status 
        },
        { status: 400 }
      )
    }

    return Response.json(data)
  } catch (error: any) {
    console.error('Error fetching Google Places details:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch place details' },
      { status: 500 }
    )
  }
}

