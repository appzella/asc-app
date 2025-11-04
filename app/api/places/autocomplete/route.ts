import { NextRequest } from 'next/server'

/**
 * API Route zum Abrufen von Google Places Autocomplete-Vorschlägen
 * GET /api/places/autocomplete?input=...
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const input = searchParams.get('input')

  if (!input) {
    return Response.json(
      { error: 'input parameter is required' },
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
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&components=country:ch&language=de`
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
    console.error('Error fetching Google Places autocomplete:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}

