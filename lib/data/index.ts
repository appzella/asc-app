import { IDataRepository } from './repository'
import { MockDataRepository } from './mockRepository'
import { SupabaseDataRepository } from './supabaseRepository'
import { isSupabaseConfigured } from '../supabase/client'

/**
 * Data Repository Factory
 * Wählt die richtige Implementierung basierend auf Environment-Variablen
 */
let repositoryInstance: IDataRepository | null = null

export function getDataRepository(): IDataRepository {
  if (repositoryInstance) {
    return repositoryInstance
  }

  // Use Supabase if configured, otherwise fall back to mock data
  if (isSupabaseConfigured) {
    console.log('✅ Using Supabase Data Repository')
    repositoryInstance = new SupabaseDataRepository()
  } else {
    console.log('⚠️ Using Mock Data Repository (Supabase not configured)')
    repositoryInstance = new MockDataRepository()
  }

  return repositoryInstance
}

// Export for convenience
export const dataRepository = getDataRepository()

