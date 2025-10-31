import { getSupabaseAdmin } from '../supabase/client'
import { User, Tour } from '../types'

/**
 * Seed-Daten für Supabase
 * Erstellt Demo-Accounts und Beispiel-Touren
 */
export async function seedSupabaseData() {
  console.log('Starting Supabase seed...')

  // Zuerst müssen wir User über Supabase Auth erstellen
  // Da wir noch kein Auth haben, erstellen wir die User direkt in der users Tabelle
  // Später wird das über Supabase Auth gemacht

  // Admin User
  const adminUser = {
    email: 'admin@asc.ch',
    name: 'Admin User',
    role: 'admin',
    registered: true,
  }

  // Leader Users
  const leader1 = {
    email: 'leader@asc.ch',
    name: 'Max Mustermann',
    role: 'leader',
    registered: true,
  }

  const leader2 = {
    email: 'leader2@asc.ch',
    name: 'Anna Schmidt',
    role: 'leader',
    registered: true,
  }

  // Member Users
  const member1 = {
    email: 'member@asc.ch',
    name: 'Peter Müller',
    role: 'member',
    registered: true,
  }

  const member2 = {
    email: 'member2@asc.ch',
    name: 'Lisa Weber',
    role: 'member',
    registered: true,
  }

  console.log('Note: Users müssen zuerst über Supabase Auth erstellt werden.')
  console.log('Für jetzt werden wir nur die Tour Settings seeden.')
  console.log('User werden später über Supabase Auth migriert.')

  // Seed Tour Settings
  const settings = [
    // Tour Types
    { setting_type: 'tour_type', setting_key: 'Wanderung', display_order: 0 },
    { setting_type: 'tour_type', setting_key: 'Skitour', display_order: 1 },
    { setting_type: 'tour_type', setting_key: 'Bike', display_order: 2 },
    
    // Tour Lengths
    { setting_type: 'tour_length', setting_key: 'Eintagestour', display_order: 0 },
    { setting_type: 'tour_length', setting_key: 'Mehrtagestour', display_order: 1 },
    
    // Difficulties - Wanderung
    { setting_type: 'difficulty', setting_key: 'T1', setting_value: 'Wanderung', display_order: 0 },
    { setting_type: 'difficulty', setting_key: 'T2', setting_value: 'Wanderung', display_order: 1 },
    { setting_type: 'difficulty', setting_key: 'T3', setting_value: 'Wanderung', display_order: 2 },
    { setting_type: 'difficulty', setting_key: 'T4', setting_value: 'Wanderung', display_order: 3 },
    { setting_type: 'difficulty', setting_key: 'T5', setting_value: 'Wanderung', display_order: 4 },
    { setting_type: 'difficulty', setting_key: 'T6', setting_value: 'Wanderung', display_order: 5 },
    
    // Difficulties - Skitour
    { setting_type: 'difficulty', setting_key: 'L', setting_value: 'Skitour', display_order: 0 },
    { setting_type: 'difficulty', setting_key: 'WS', setting_value: 'Skitour', display_order: 1 },
    { setting_type: 'difficulty', setting_key: 'ZS', setting_value: 'Skitour', display_order: 2 },
    { setting_type: 'difficulty', setting_key: 'S', setting_value: 'Skitour', display_order: 3 },
    { setting_type: 'difficulty', setting_key: 'SS', setting_value: 'Skitour', display_order: 4 },
    { setting_type: 'difficulty', setting_key: 'AS', setting_value: 'Skitour', display_order: 5 },
    { setting_type: 'difficulty', setting_key: 'EX', setting_value: 'Skitour', display_order: 6 },
    
    // Difficulties - Bike
    { setting_type: 'difficulty', setting_key: 'B1', setting_value: 'Bike', display_order: 0 },
    { setting_type: 'difficulty', setting_key: 'B2', setting_value: 'Bike', display_order: 1 },
    { setting_type: 'difficulty', setting_key: 'B3', setting_value: 'Bike', display_order: 2 },
    { setting_type: 'difficulty', setting_key: 'B4', setting_value: 'Bike', display_order: 3 },
    { setting_type: 'difficulty', setting_key: 'B5', setting_value: 'Bike', display_order: 4 },
  ]

  try {
    // Use admin client to bypass RLS for seeding
    const adminClient = getSupabaseAdmin()

    // Check if settings already exist
    const { data: existingSettings } = await adminClient
      .from('tour_settings')
      .select('id')
      .limit(1)

    if (existingSettings && existingSettings.length > 0) {
      console.log('Tour settings already exist, skipping seed.')
      return
    }

    const { error } = await adminClient
      .from('tour_settings')
      .insert(settings)

    if (error) {
      console.error('Error seeding tour settings:', error)
      throw error
    }

    console.log('✅ Tour settings seeded successfully!')
  } catch (error) {
    console.error('Error during seed:', error)
    throw error
  }
}

