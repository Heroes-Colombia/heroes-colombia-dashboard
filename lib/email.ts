import { Resend } from "resend"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Héroes Colombia <noreply@heroescolombia.com>"

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  if (!RESEND_API_KEY) {
    console.warn("[Email] Resend API key not configured. Email not sent:", { to, subject })
    return { success: false, error: "API key not configured" }
  }

  try {
    const data = await resend!.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    })
    console.log("[Email] Sent successfully:", data)
    return { success: true, data }

  } catch (error) {
    console.error("[Email] Error sending email:", error)
    return { success: false, error }
  }
}

export async function sendTrialAdminEmail({
  businessName,
  email,
  phone,
}: {
  businessName: string
  email: string
  phone?: string
}) {
  const subject = "Registro al trial de Héroes Colombia! 🎉"

  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4a6838; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
        .field { margin: 15px 0; }
        .label { font-weight: bold; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🤑 Una nueva empresa empezo el flujo para pagar en Mercado Pago</h2>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Negocio:</div>
            <div>${businessName}</div>
          </div>
          <div class="field">
            <div class="label">Email:</div>
            <div><a href="mailto:${email}">${email}</a></div>
          </div>
          <div class="field">
            <div class="label">Phone:</div>
            <div>${phone}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  // Send to admin
  await sendEmail({
    to: "jonathan@heroescolombia.com",
    subject: subject,
    html: adminHtml,
  })
}

// Feedback Form Email
export async function sendFeedbackEmail({
  name,
  email,
  phone,
  message,
  variant,
}: {
  name: string
  email: string
  phone: string
  message: string
  variant: "user" | "business"
}) {
  const adminSubject = `Nuevo Feedback ${variant === "user" ? "de Usuario" : "de Negocio"} - ${name}`

  const adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4a6838; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .field { margin: 15px 0; }
    .label { font-weight: bold; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📝 Nuevo Feedback Recibido</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Tipo:</div>
        <div>${variant === "user" ? "Usuario" : "Negocio"}</div>
      </div>
      <div class="field">
        <div class="label">Nombre:</div>
        <div>${name}</div>
      </div>
      <div class="field">
        <div class="label">Email:</div>
        <div><a href="mailto:${email}">${email}</a></div>
      </div>
      <div class="field">
        <div class="label">Phone:</div>
        <div>${phone}</div>
      </div>
      <div class="field">
        <div class="label">Mensaje:</div>
        <div>${message}</div>
      </div>
    </div>
  </div>
</body>
</html>
`

  // Send to admin
  await sendEmail({
    to: "jonathan@heroescolombia.com",
    subject: adminSubject,
    html: adminHtml,
  })
}

// Demo Request Email
export async function sendDemoRequestEmail({
  businessName,
  category,
  contactName,
  email,
  phone,
  monthlyRevenue,
  message,
}: {
  businessName: string
  category: string
  contactName: string
  email: string
  phone: string
  monthlyRevenue: string
  message: string
}) {
  const adminSubject = `Nueva Solicitud de Demo - ${businessName}`

  const adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .field { margin: 15px 0; }
    .label { font-weight: bold; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎯 Nueva Solicitud de Demo</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Nombre del Negocio:</div>
        <div>${businessName}</div>
      </div>
      <div class="field">
        <div class="label">Categoría:</div>
        <div>${category}</div>
      </div>
      <div class="field">
        <div class="label">Contacto:</div>
        <div>${contactName}</div>
      </div>
      <div class="field">
        <div class="label">Email:</div>
        <div><a href="mailto:${email}">${email}</a></div>
      </div>
      <div class="field">
        <div class="label">Teléfono:</div>
        <div><a href="tel:${phone}">${phone}</a></div>
      </div>
      <div class="field">
        <div class="label">Facturación Mensual:</div>
        <div>${monthlyRevenue}</div>
      </div>
      <div class="field">
        <div class="label">Mensaje:</div>
        <div>${message}</div>
      </div>
    </div>
  </div>
</body>
</html>
`

  // Send to admin
  await sendEmail({
    to: "jonathan@heroescolombia.com",
    subject: adminSubject,
    html: adminHtml,
  })
}

// Subscription Confirmation Email
export async function sendSubscriptionConfirmationEmail({
  email,
  plan,
  billingPeriod,
  nextPaymentDate,
}: {
  email: string
  plan: string
  billingPeriod: string
  nextPaymentDate?: string
}) {
  const planNames: Record<string, string> = {
    basico: "Básico",
    pro: "Pro",
    enterprise: "Enterprise",
  }

  const planName = planNames[plan] || plan
  const periodLabel = billingPeriod === "monthly" ? "Mensual" : "Anual"

  const formattedNextPayment = nextPaymentDate
    ? new Date(nextPaymentDate).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Por definir"

  const subject = `¡Bienvenido al Plan ${planName} de Héroes Colombia!`

  const businessHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4a6838 0%, #5d8347 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .plan-badge { display: inline-block; background: #f0fdf4; color: #166534; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 10px 0; }
    .details-card { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 600; color: #111827; }
    .cta-button { display: inline-block; background: #4a6838; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Suscripción Activada!</h1>
      <p>Gracias por confiar en Héroes Colombia</p>
    </div>
    <div class="content">
      <p>Tu suscripción ha sido procesada exitosamente. Ya puedes disfrutar de todos los beneficios de tu plan.</p>

      <div style="text-align: center;">
        <span class="plan-badge">Plan ${planName} - ${periodLabel}</span>
      </div>

      <div class="details-card">
        <div class="detail-row">
          <span class="detail-label">Plan:</span>
          <span class="detail-value">${planName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Facturación:</span>
          <span class="detail-value">${periodLabel}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Próximo cobro:</span>
          <span class="detail-value">${formattedNextPayment}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="https://app.heroescolombia.com/business/dashboard" class="cta-button">
          Ir a mi Dashboard
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        Si tienes alguna pregunta sobre tu suscripción, no dudes en contactarnos respondiendo a este correo o escribiéndonos por WhatsApp.
      </p>
    </div>
    <div class="footer">
      <p>© 2026 Héroes Colombia. Todos los derechos reservados.</p>
      <p>Este correo fue enviado a ${email}</p>
    </div>
  </div>
</body>
</html>
`

  // Send to business
  await sendEmail({
    to: email,
    subject,
    html: businessHtml,
  })

  // Also notify admin
  const adminSubject = `Nueva Suscripción - Plan ${planName} (${periodLabel})`
  const adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .field { margin: 15px 0; }
    .label { font-weight: bold; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>💰 Nueva Suscripción Activada</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Email del negocio:</div>
        <div><a href="mailto:${email}">${email}</a></div>
      </div>
      <div class="field">
        <div class="label">Plan:</div>
        <div>${planName}</div>
      </div>
      <div class="field">
        <div class="label">Facturación:</div>
        <div>${periodLabel}</div>
      </div>
      <div class="field">
        <div class="label">Próximo cobro:</div>
        <div>${formattedNextPayment}</div>
      </div>
    </div>
  </div>
</body>
</html>
`

  await sendEmail({
    to: "jonathan@heroescolombia.com",
    subject: adminSubject,
    html: adminHtml,
  })
}

