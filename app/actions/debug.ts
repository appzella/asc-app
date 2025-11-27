'use server'

import { getSupabaseAdmin } from '@/lib/supabase/client'

export async function testNotificationSystem(userId: string) {
    const logs: string[] = []
    logs.push('Starting notification system test...')

    // 1. Check Env Vars
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
        logs.push('✅ SUPABASE_SERVICE_ROLE_KEY is present')
        logs.push(`   Length: ${serviceRoleKey.length}`)
    } else {
        logs.push('❌ SUPABASE_SERVICE_ROLE_KEY is MISSING')
    }

    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (vapidPublic) {
        logs.push('✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY is present')
    } else {
        logs.push('❌ NEXT_PUBLIC_VAPID_PUBLIC_KEY is MISSING')
    }

    const vapidPrivate = process.env.VAPID_PRIVATE_KEY
    if (vapidPrivate) {
        logs.push('✅ VAPID_PRIVATE_KEY is present')
    } else {
        logs.push('❌ VAPID_PRIVATE_KEY is MISSING')
    }

    // 2. Test DB Connection with Admin Client
    try {
        const supabase = getSupabaseAdmin()
        logs.push('✅ Admin client created')

        // 3. Try to fetch user preferences
        const { data: pref, error: prefError } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (prefError) {
            logs.push(`⚠️ Error fetching preferences: ${prefError.message} (${prefError.code})`)
            if (prefError.code === 'PGRST116') {
                logs.push('   (This is normal if user has no preferences yet)')
            }
        } else {
            logs.push('✅ Preferences found for user')
        }

        // 4. Try to insert a test notification
        logs.push('Attempting to insert test notification...')
        const { data: notif, error: insertError } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type: 'NEW_TOUR', // Using string literal as per previous fix
                title: 'Test Notification',
                message: 'This is a test notification from the debug tool.',
                link: '/debug',
                read: false,
            })
            .select()
            .single()

        if (insertError) {
            logs.push(`❌ Error inserting notification: ${insertError.message}`)
            logs.push(`   Details: ${insertError.details}`)
            logs.push(`   Hint: ${insertError.hint}`)
        } else {
            logs.push('✅ Test notification inserted successfully!')
            logs.push(`   ID: ${notif.id}`)
        }

    } catch (error: any) {
        logs.push(`❌ Exception occurred: ${error.message}`)
        logs.push(JSON.stringify(error, null, 2))
    }

    return logs
}
