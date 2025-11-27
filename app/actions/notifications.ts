'use server'

import webpush from 'web-push'
import { getSupabaseAdmin } from '@/lib/supabase/client'

// Configure web-push
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateVapidKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@asc-skitouren.ch'

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(
        vapidSubject,
        publicVapidKey,
        privateVapidKey
    )
}

async function sendPushNotification(userId: string, title: string, body: string, url: string) {
    if (!publicVapidKey || !privateVapidKey) {
        console.warn('VAPID keys not configured, skipping push notification')
        return
    }

    const supabase = getSupabaseAdmin()

    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) return

    const payload = JSON.stringify({
        title,
        body,
        url,
    })

    // Send to all subscriptions (user might have multiple devices)
    const promises = subscriptions.map(async (sub) => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                p256dh: atob(sub.p256dh),
                auth: atob(sub.auth),
            },
        }

        try {
            await webpush.sendNotification(pushSubscription, payload)
        } catch (error: any) {
            if (error.statusCode === 410 || error.statusCode === 404) {
                // Subscription is no longer valid, remove it
                await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('endpoint', sub.endpoint)
            } else {
                console.error('Error sending push notification:', error)
            }
        }
    })

    await Promise.all(promises)
}

export async function notifyNewTour(tourId: string) {
    console.log('notifyNewTour called for:', tourId)
    const supabase = getSupabaseAdmin()

    // 1. Fetch tour details
    const { data: tour } = await supabase
        .from('tours')
        .select('title, leader_id')
        .eq('id', tourId)
        .single()

    if (!tour) {
        console.error('Tour not found:', tourId)
        return
    }

    // 2. Fetch all users except the creator (leader)
    const { data: users } = await supabase
        .from('users')
        .select('id')
        .neq('id', tour.leader_id)

    if (!users) return

    // 3. Fetch preferences for these users
    const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .in('user_id', users.map(u => u.id))

    // Map preferences by user_id for easy lookup
    const prefsMap = new Map(preferences?.map(p => [p.user_id, p]))

    // 4. Filter users who want notifications
    const notificationsToCreate: any[] = []
    const pushNotificationsToSend: Promise<void>[] = []

    for (const user of users) {
        const pref = prefsMap.get(user.id)

        // Default to TRUE if no preference record exists
        const emailNewTour = pref ? pref.email_new_tour : true
        const pushNewTour = pref ? pref.push_new_tour : true

        if (emailNewTour || pushNewTour) {
            notificationsToCreate.push({
                user_id: user.id,
                type: 'NEW_TOUR',
                title: 'Neue Tour verfügbar',
                message: `Eine neue Tour "${tour.title}" wurde erstellt.`,
                link: `/tours/${tourId}`,
                read: false,
            })
        }

        if (pushNewTour) {
            pushNotificationsToSend.push(
                sendPushNotification(
                    user.id,
                    'Neue Tour verfügbar',
                    `Eine neue Tour "${tour.title}" wurde erstellt.`,
                    `/tours/${tourId}`
                )
            )
        }
    }

    // 5. Batch insert notifications
    if (notificationsToCreate.length > 0) {
        const { error } = await supabase.from('notifications').insert(notificationsToCreate)
        if (error) console.error('Error inserting notifications:', error)
    }

    // 6. Send push notifications
    await Promise.all(pushNotificationsToSend)
}

export async function notifyParticipantSignup(tourId: string, participantId: string) {
    console.log('notifyParticipantSignup called:', tourId, participantId)
    const supabase = getSupabaseAdmin()

    // 1. Fetch tour details
    const { data: tour } = await supabase
        .from('tours')
        .select('title, leader_id')
        .eq('id', tourId)
        .single()

    if (!tour) {
        console.error('Tour not found:', tourId)
        return
    }

    // 2. Fetch participant details
    const { data: participant } = await supabase
        .from('users')
        .select('name')
        .eq('id', participantId)
        .single()

    if (!participant) {
        console.error('Participant not found:', participantId)
        return
    }

    // 3. Get tour leader's preferences
    const { data: pref } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', tour.leader_id)
        .single()

    // Default to TRUE if no preference record exists
    const emailParticipantSignup = pref ? pref.email_participant_signup : true
    const pushParticipantSignup = pref ? pref.push_participant_signup : true

    // 4. Create notification if enabled
    if (emailParticipantSignup || pushParticipantSignup) {
        const { error } = await supabase.from('notifications').insert({
            user_id: tour.leader_id,
            type: 'PARTICIPANT_SIGNUP',
            title: 'Neue Anmeldung',
            message: `${participant.name} hat sich für Ihre Tour "${tour.title}" angemeldet.`,
            link: `/tours/${tourId}`,
            read: false,
        })
        if (error) console.error('Error creating notification:', error)
    }

    // 5. Send push if enabled
    if (pushParticipantSignup) {
        await sendPushNotification(
            tour.leader_id,
            'Neue Anmeldung',
            `${participant.name} hat sich für Ihre Tour "${tour.title}" angemeldet.`,
            `/tours/${tourId}`
        )
    }
}

export async function notifyTourUpdate(tourId: string, updatedByUserId: string) {
    console.log('notifyTourUpdate called:', tourId)
    const supabase = getSupabaseAdmin()

    // 1. Fetch tour details
    const { data: tour } = await supabase
        .from('tours')
        .select('title')
        .eq('id', tourId)
        .single()

    if (!tour) return

    // 2. Fetch all participants
    const { data: participants } = await supabase
        .from('tour_participants')
        .select('user_id')
        .eq('tour_id', tourId)

    if (!participants || participants.length === 0) return

    // Filter out the person who updated it
    const participantIds = participants
        .map(p => p.user_id)
        .filter(id => id !== updatedByUserId)

    if (participantIds.length === 0) return

    // 3. Fetch preferences
    const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .in('user_id', participantIds)

    const prefsMap = new Map(preferences?.map(p => [p.user_id, p]))

    const notificationsToCreate: any[] = []
    const pushNotificationsToSend: Promise<void>[] = []

    for (const userId of participantIds) {
        const pref = prefsMap.get(userId)

        // Default to TRUE
        const emailTourUpdate = pref ? pref.email_tour_update : true
        const pushTourUpdate = pref ? pref.push_tour_update : true

        if (emailTourUpdate || pushTourUpdate) {
            notificationsToCreate.push({
                user_id: userId,
                type: 'TOUR_UPDATE',
                title: 'Tour aktualisiert',
                message: `Die Tour "${tour.title}" wurde aktualisiert.`,
                link: `/tours/${tourId}`,
                read: false,
            })
        }

        if (pushTourUpdate) {
            pushNotificationsToSend.push(
                sendPushNotification(
                    userId,
                    'Tour aktualisiert',
                    `Die Tour "${tour.title}" wurde aktualisiert.`,
                    `/tours/${tourId}`
                )
            )
        }
    }

    if (notificationsToCreate.length > 0) {
        const { error } = await supabase.from('notifications').insert(notificationsToCreate)
        if (error) console.error('Error inserting notifications:', error)
    }

    await Promise.all(pushNotificationsToSend)
}
