import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@^2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, token, inviterName, appUrl } = await req.json()

    if (!email || !token || !appUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, token, appUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not set')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resend = new Resend(resendApiKey)

    // Generate registration link
    const registrationLink = `${appUrl}/register/${token}`

    // Email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">ASC Skiclub</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Willkommen beim ASC Skiclub!</h2>
          
          <p>Hallo,</p>
          
          <p><strong>${inviterName || 'Ein Administrator'}</strong> lädt Sie ein, der <strong>ASC Skitouren App</strong> beizutreten.</p>
          
          <p>Mit dieser App können Sie:</p>
          <ul style="padding-left: 20px;">
            <li>An Skitouren teilnehmen</li>
            <li>Mit anderen Teilnehmern kommunizieren</li>
            <li>Ihre Touren verwalten</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registrationLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Jetzt registrieren
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:<br>
            <a href="${registrationLink}" style="color: #667eea; word-break: break-all;">${registrationLink}</a>
          </p>
          
          <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
            Dieser Einladungslink ist für 7 Tage gültig.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af;">
            Alpine Skiclub St. Gallen<br>
            Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
          </p>
        </div>
      </body>
      </html>
    `

    const emailText = `
Willkommen beim ASC Skiclub!

${inviterName || 'Ein Administrator'} lädt Sie ein, der ASC Skitouren App beizutreten.

Mit dieser App können Sie:
- An Skitouren teilnehmen
- Mit anderen Teilnehmern kommunizieren
- Ihre Touren verwalten

Registrieren Sie sich hier:
${registrationLink}

Dieser Einladungslink ist für 7 Tage gültig.

Alpine Skiclub St. Gallen
Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
    `.trim()

    // Determine sender email based on domain verification status
    // For testing: Use Resend's default domain (onboarding@resend.dev)
    // For production: Use your verified domain (noreply@asc-skiclub.ch)
    const senderEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
    const senderName = Deno.env.get('RESEND_FROM_NAME') || 'ASC Skiclub'
    
    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: email,
      subject: 'Einladung zum ASC Skitouren App',
      html: emailHtml,
      text: emailText,
    })

    if (error) {
      console.error('Resend error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-invitation-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

