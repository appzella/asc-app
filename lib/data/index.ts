import { IDataRepository } from './repository'
import { MockDataRepository } from './mockRepository'

/**
 * Data Repository Factory
 * Currently hardcoded to use MockDataRepository for the migration to Firebase.
 */
let repositoryInstance: IDataRepository | null = null

export function getDataRepository(): IDataRepository {
  if (repositoryInstance) {
    return repositoryInstance
  }

  // Always use Mock Repository for now
  repositoryInstance = new MockDataRepository()

  return repositoryInstance
}

// Export for convenience
export const dataRepository = getDataRepository()

