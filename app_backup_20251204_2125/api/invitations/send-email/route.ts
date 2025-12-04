import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'

/**
 * API Route zum Versenden von Einladungs-E-Mails
 * POST /api/invitations/send-email
 * 
 * Body: { invitationId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { invitationId } = await req.json()

    if (!invitationId) {
      return Response.json(
        { error: 'invitationId is required' },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdmin()

    // Get invitation with creator name
    const { data: invitation, error: invError } = await admin
      .from('invitations')
      .select(`
        *,
        creator:users!invitations_created_by_fkey(
          name
        )
      `)
      .eq('id', invitationId)
      .single()

    if (invError || !invitation) {
      console.error('Error fetching invitation:', invError)
      return Response.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    if (invitation.used) {
      return Response.json(
        { error: 'Invitation has already been used' },
        { status: 400 }
      )
    }

    // Get app URL from environment
    // Priority: NEXT_PUBLIC_APP_URL > VERCEL_URL (production) > default
    let appUrl = process.env.NEXT_PUBLIC_APP_URL
    
    if (!appUrl) {
      // Check if we're on Vercel production
      const vercelUrl = process.env.VERCEL_URL
      if (vercelUrl && process.env.VERCEL_ENV === 'production') {
        // Production: use custom domain or vercel.app
        appUrl = `https://${vercelUrl.includes('asc-app') ? vercelUrl : 'asc-app.vercel.app'}`
      } else if (vercelUrl && process.env.VERCEL_ENV !== 'production') {
        // Preview/Development: use vercel URL (but prefer NEXT_PUBLIC_APP_URL if set)
        appUrl = `https://${vercelUrl}`
      } else {
        // Local development
        appUrl = 'http://localhost:3000'
      }
    }
    
    // Fallback: Always use production URL if not explicitly set
    if (!appUrl || appUrl.includes('localhost')) {
      appUrl = 'https://asc-app.vercel.app'
    }

    // Call Supabase Edge Function
    const { data, error } = await admin.functions.invoke('send-invitation-email', {
      body: {
        email: invitation.email,
        token: invitation.token,
        inviterName: invitation.creator?.name || 'Ein Administrator',
        appUrl: appUrl,
      },
    })

    if (error) {
      console.error('Error invoking edge function:', error)
      return Response.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      )
    }

    return Response.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in send-email route:', error)
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

