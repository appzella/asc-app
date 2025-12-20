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

import webpush from 'web-push'

export async function testPushNotification(userId: string) {
    const logs: string[] = []
    logs.push('Starting Push Notification Test...')

    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateVapidKey = process.env.VAPID_PRIVATE_KEY
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@asc-skitouren.ch'

    if (!publicVapidKey || !privateVapidKey) {
        logs.push('❌ VAPID keys are missing!')
        return logs
    }

    try {
        webpush.setVapidDetails(
            vapidSubject,
            publicVapidKey,
            privateVapidKey
        )
        logs.push('✅ WebPush configured')
    } catch (err: any) {
        logs.push(`❌ WebPush configuration failed: ${err.message}`)
        return logs
    }

    const supabase = getSupabaseAdmin()

    // Fetch subscriptions
    const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)

    if (error) {
        logs.push(`❌ Error fetching subscriptions: ${error.message}`)
        return logs
    }

    if (!subscriptions || subscriptions.length === 0) {
        logs.push('⚠️ No push subscriptions found for this user.')
        logs.push('   Please ensure you have enabled push notifications in your profile settings.')
        return logs
    }

    logs.push(`✅ Found ${subscriptions.length} subscription(s)`)

    for (const sub of subscriptions) {
        logs.push(`Testing subscription: ${sub.endpoint.substring(0, 20)}...`)

        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
            },
        }

        const payload = JSON.stringify({
            title: 'Debug Push',
            body: 'This is a test push notification from the debug tool.',
            url: '/debug',
        })

        try {
            await webpush.sendNotification(pushSubscription, payload)
            logs.push('✅ Push sent successfully!')
        } catch (err: any) {
            logs.push(`❌ Failed to send push: ${err.message}`)
            logs.push(`   Status Code: ${err.statusCode}`)
            if (err.statusCode === 410 || err.statusCode === 404) {
                logs.push('   (Subscription is invalid/expired)')
            }
        }
    }

    return logs
}
