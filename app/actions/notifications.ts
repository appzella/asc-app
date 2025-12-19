'use server'

/**
 * Mock Notification Service
 * Replaces the Supabase/WebPush implementation for the migration to Firebase.
 */

export async function notifyNewTour(tourId: string) {
    console.log(`[Mock Notification] New Tour created: ${tourId}`)
}

export async function notifyParticipantSignup(tourId: string, participantId: string) {
    console.log(`[Mock Notification] Participant ${participantId} signed up for tour ${tourId}`)
}

export async function notifyTourUpdate(tourId: string, updatedByUserId: string) {
    console.log(`[Mock Notification] Tour ${tourId} updated by ${updatedByUserId}`)
}
