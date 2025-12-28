'use server'

import { getServerRepository } from "@/lib/data/server"
import { createClient } from "@/lib/supabase/server"

export async function getNotifications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const repository = await getServerRepository()
    return repository.getNotifications(user.id)
}

export async function markNotificationAsRead(notificationId: string) {
    const repository = await getServerRepository()
    await repository.markNotificationAsRead(notificationId)
}

export async function markAllNotificationsAsRead() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const repository = await getServerRepository()
    await repository.markAllNotificationsAsRead(user.id)
}

export async function notifyNewTour(tourId: string) {
    const repository = await getServerRepository()
    const tour = await repository.getTourById(tourId)

    if (!tour) return

    await repository.createNotificationForAllUsers({
        type: 'NEW_TOUR',
        title: 'Neue Tour veröffentlicht',
        message: `Die Tour "${tour.title}" wurde erstellt.`,
        link: `/tours/${tourId}`,
    }, tour.leaderId) // Exclude the leader who created it
}

export async function notifyTourUpdate(tourId: string, updatedByUserId: string) {
    const repository = await getServerRepository()
    const tour = await repository.getTourById(tourId)

    if (!tour) return

    // Notify all participants except the person who updated
    for (const participant of tour.participants) {
        if (participant.id !== updatedByUserId) {
            await repository.createNotification({
                userId: participant.id,
                type: 'TOUR_UPDATE',
                title: 'Tour aktualisiert',
                message: `Die Tour "${tour.title}" wurde geändert.`,
                link: `/tours/${tourId}`,
            })
        }
    }
}

export async function notifyParticipantSignup(tourId: string, participantId: string) {
    const repository = await getServerRepository()
    const tour = await repository.getTourById(tourId)
    const participant = await repository.getUserById(participantId)

    if (!tour || !participant) return

    await repository.createNotification({
        userId: tour.leaderId,
        type: 'PARTICIPANT_SIGNUP',
        title: 'Neue Anmeldung',
        message: `${participant.name} hat sich für "${tour.title}" angemeldet.`,
        link: `/tours/${tourId}`,
    })
}

export async function notifyParticipantLeft(tourId: string, participantId: string) {
    const repository = await getServerRepository()
    const tour = await repository.getTourById(tourId)
    const participant = await repository.getUserById(participantId)

    if (!tour || !participant) return

    await repository.createNotification({
        userId: tour.leaderId,
        type: 'PARTICIPANT_SIGNUP',
        title: 'Abmeldung',
        message: `${participant.name} hat sich von "${tour.title}" abgemeldet.`,
        link: `/tours/${tourId}`,
    })
}
