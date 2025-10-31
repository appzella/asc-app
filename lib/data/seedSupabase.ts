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

    // Seed Demo Tours (if leader users exist)
    await seedDemoTours(adminClient)
  } catch (error) {
    console.error('Error during seed:', error)
    throw error
  }
}

/**
 * Erstellt Demo-Touren für Testzwecke
 * Benötigt existierende Leader-User in public.users
 */
async function seedDemoTours(adminClient: ReturnType<typeof getSupabaseAdmin>) {
  try {
    // Prüfe, ob bereits Touren existieren
    const { data: existingTours } = await adminClient
      .from('tours')
      .select('id')
      .limit(1)

    if (existingTours && existingTours.length > 0) {
      console.log('Tours already exist, skipping tour seed.')
      return
    }

    // Suche nach Leader-Usern
    const { data: leaders } = await adminClient
      .from('users')
      .select('id, email')
      .eq('role', 'leader')
      .limit(2)

    if (!leaders || leaders.length === 0) {
      console.log('⚠️ No leader users found. Skipping tour seed.')
      console.log('💡 Create a leader user via Supabase Auth first, then run seed again.')
      return
    }

    const leader1Id = leaders[0].id
    const leader2Id = leaders.length > 1 ? leaders[1].id : leaders[0].id

    // Erstelle Demo-Touren
    const demoTours = [
      {
        title: 'Skitour auf den Säntis',
        description: 'Schöne Skitour auf den Säntis mit herrlicher Aussicht. Perfekt für den Chat-Test!',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 Tage in der Zukunft
        difficulty: 'ZS',
        tour_type: 'Skitour',
        tour_length: 'Eintagestour',
        elevation: 1800,
        duration: 6,
        leader_id: leader1Id,
        max_participants: 8,
        status: 'approved', // Direkt freigegeben für schnellen Test
        created_by: leader1Id,
      },
      {
        title: 'Wanderung Toggenburg',
        description: 'Gemütliche Wanderung durch das Toggenburg. Ideal zum Testen des Chats!',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 Tage in der Zukunft
        difficulty: 'T2',
        tour_type: 'Wanderung',
        tour_length: 'Eintagestour',
        elevation: 500,
        duration: 4,
        leader_id: leader2Id,
        max_participants: 12,
        status: 'approved', // Direkt freigegeben für schnellen Test
        created_by: leader2Id,
      },
    ]

    const { error: tourError } = await adminClient
      .from('tours')
      .insert(demoTours)

    if (tourError) {
      console.error('Error seeding tours:', tourError)
      // Nicht werfen, da Settings bereits erfolgreich waren
      console.log('⚠️ Tour seeding failed, but settings were seeded successfully.')
      return
    }

    console.log('✅ Demo tours seeded successfully!')
    console.log('💡 You can now test the chat by opening one of these tours.')
  } catch (error) {
    console.error('Error seeding demo tours:', error)
    // Nicht werfen, da Settings bereits erfolgreich waren
  }
}

