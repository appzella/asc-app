import { seedSupabaseData } from '@/lib/data/seedSupabase'

/**
 * API Route zum Seeding von Supabase
 * GET /api/seed-supabase
 */
export async function GET() {
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

