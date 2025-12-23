import { IDataRepository } from './repository'
import { supabaseRepository } from './supabaseRepository'

/**
 * Data Repository Factory
 * Now using Supabase for production data.
 */
let repositoryInstance: IDataRepository | null = null

export function getDataRepository(): IDataRepository {
  if (repositoryInstance) {
    return repositoryInstance
  }

  // Use Supabase Repository for production
  repositoryInstance = supabaseRepository

  return repositoryInstance
}

// Export for convenience
export const dataRepository = getDataRepository()
