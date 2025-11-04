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
    repositoryInstance = new SupabaseDataRepository()
  } else {
    repositoryInstance = new MockDataRepository()
  }

  return repositoryInstance
}

// Export for convenience
export const dataRepository = getDataRepository()

