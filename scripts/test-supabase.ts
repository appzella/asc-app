#!/usr/bin/env node
/**
 * Test-Script für Supabase-Verbindung und Seeding
 * 
 * Usage:
 *   npx tsx scripts/test-supabase.ts
 */

import { testConnection } from '../lib/data/testSupabase'
import { seedSupabaseData } from '../lib/data/seedSupabase'

async function main() {
  console.log('🔍 Testing Supabase connection...\n')
  
  const connectionOk = await testConnection()
  
  if (!connectionOk) {
    console.error('\n❌ Connection test failed. Please check your .env.local file.')
    process.exit(1)
  }

  console.log('\n🌱 Seeding Supabase data...\n')
  
  try {
    await seedSupabaseData()
    console.log('\n✅ All done! Supabase is ready to use.')
  } catch (error: any) {
    console.error('\n❌ Error during seeding:', error.message)
    process.exit(1)
  }
}

main()

