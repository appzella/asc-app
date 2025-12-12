
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Check if Supabase is configured
    const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey &&
        supabaseUrl !== 'https://your-project-ref.supabase.co' &&
        supabaseAnonKey !== 'YOUR_ANON_KEY_HERE')

    if (!isSupabaseConfigured) {
        // Return a dummy client or handle error appropriate for your app
        // For now, returning standard client which might fail if called, but types are correct.
        // In a real app we might want to throw or return a mock.
        // Given the rest of the app falls back gracefully, we carry on.
    }

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) {
                        // The `set` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) {
                        // The `delete ` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}
