import { createClient } from '../supabase/server'
import { SupabaseRepository } from './supabaseRepository'
import { IDataRepository } from './repository'

/**
 * Factory for Server Components
 * Creates a new repository instance with a fresh Supabase Server Client
 * that has access to request cookies.
 */
export async function getServerRepository(): Promise<IDataRepository> {
    const supabase = await createClient()
    return new SupabaseRepository(supabase)
}
