import { Resend } from "resend"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Héroes Colombia <noreply@heroescolombia.com>"

export class EmailService {
  /**
   * Send business team invitation email
   */
  static async sendTeamInvitation(params: {
    to: string
    inviterName: string
    businessName: string
    role: string
    invitationToken: string
  }) {
    if (!RESEND_API_KEY || !resend) {
      console.error("[Email] Resend API key not configured. Email not sent.")
      throw new Error("Resend API key not configured")
    }

    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invitation?token=${params.invitationToken}`

    try {
      const { data, error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: params.to,
        subject: `Invitación al equipo de ${params.businessName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">

              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #5d7a3a; margin: 0;">Héroes Colombia</h1>
              </div>

              <!-- Main Content -->
              <div style="background: #f5f7f5; border-radius: 8px; padding: 30px;">
                <h2 style="color: #1a1a1a; margin-top: 0;">Invitación al equipo de ${params.businessName}</h2>

                <p style="font-size: 16px; color: #6b7280;">
                  <strong>${params.inviterName}</strong> te ha invitado a unirte al equipo de
                  <strong>${params.businessName}</strong> como <strong>${params.role}</strong>.
                </p>

                <p style="font-size: 16px; color: #6b7280;">
                  Podrás acceder al panel de administración y gestionar las promociones de acuerdo a los permisos asignados.
                </p>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${acceptUrl}"
                     style="background: #5d7a3a;
                            color: white;
                            padding: 14px 28px;
                            text-decoration: none;
                            border-radius: 6px;
                            display: inline-block;
                            font-weight: 600;
                            font-size: 16px;">
                    Aceptar Invitación
                  </a>
                </div>

                <!-- Alternative Link -->
                <p style="font-size: 14px; color: #6b7280; text-align: center;">
                  O copia este enlace en tu navegador:<br>
                  <a href="${acceptUrl}" style="color: #032291; word-break: break-all;">${acceptUrl}</a>
                </p>
              </div>

              <!-- Footer -->
              <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px;">
                <p>
                  Si no solicitaste esta invitación, puedes ignorar este correo de forma segura.
                </p>
                <p>
                  © ${new Date().getFullYear()} Héroes Colombia. Todos los derechos reservados.
                </p>
              </div>

            </body>
          </html>
        `,
      })

      if (error) {
        console.error("[Email] Resend API error:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error sending invitation email:", error)
      throw error
    }
  }
}
