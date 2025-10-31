import { supabase, getSupabaseAdmin } from '../supabase/client'

/**
 * Helper Script zum Testen der Supabase-Verbindung und Seeding
 * 
 * Usage (im Browser Console oder als API Route):
 * import { testSupabaseConnection, seedSupabaseData } from '@/lib/data/seedSupabase'
 * await testSupabaseConnection()
 * await seedSupabaseData()
 */
export async function testConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test 1: Check if we can query tour_settings (public read is allowed)
    const { data: settings, error: settingsError } = await supabase
      .from('tour_settings')
      .select('*')
      .limit(1)

    if (settingsError) {
      console.error('❌ Error querying tour_settings:', settingsError)
      return false
    }

    console.log('✅ Can query tour_settings:', settings?.length || 0, 'rows')

    // Test 2: Check if we can query users table (using admin client for RLS bypass)
    const adminClient = getSupabaseAdmin()
    const { data: users, error: usersError } = await adminClient
      .from('users')
      .select('id')
      .limit(1)

    if (usersError) {
      console.error('❌ Error querying users:', usersError)
      return false
    }

    console.log('✅ Can query users:', users?.length || 0, 'rows')

    // Test 3: Check if we can query tours table
    const { data: tours, error: toursError } = await adminClient
      .from('tours')
      .select('id')
      .limit(1)

    if (toursError) {
      console.error('❌ Error querying tours:', toursError)
      return false
    }

    console.log('✅ Can query tours:', tours?.length || 0, 'rows')

    console.log('✅ All connection tests passed!')
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

