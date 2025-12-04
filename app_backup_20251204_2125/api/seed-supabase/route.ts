import { seedSupabaseData } from '@/lib/data/seedSupabase'

/**
 * API Route zum Seeding von Supabase
 * GET /api/seed-supabase
 * Nur in Development verfügbar
 */
export async function GET() {
  // Nur in Development verfügbar
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { success: false, error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    await seedSupabaseData()
    return Response.json({ success: true, message: 'Supabase seeded successfully' })
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

