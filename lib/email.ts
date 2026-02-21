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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #5d7a3a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #e5e7e5; border-top: none; border-radius: 0 0 8px 8px; }
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

// Trial Welcome Email
export async function sendTrialWelcomeEmail({
  email,
  businessName,
  trialEndDate,
}: {
  email: string
  businessName: string
  trialEndDate: Date
}) {
  const formattedEndDate = trialEndDate.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const subject = `¡Bienvenido a Héroes Colombia, ${businessName}!`

  const businessHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #5d7a3a 0%, #7fa64e 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7e5; border-top: none; }
    .trial-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 10px 0; }
    .details-card { background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #5d7a3a; }
    .feature-list { list-style: none; padding: 0; margin: 20px 0; }
    .feature-list li { padding: 8px 0; display: flex; align-items: center; }
    .feature-list li::before { content: "✓"; color: #5d7a3a; font-weight: bold; margin-right: 10px; }
    .cta-button { display: inline-block; background: #5d7a3a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .warning-box { background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .footer { background: #f9fafb; padding: 20px 30px; border: 1px solid #e5e7e5; border-top: none; border-radius: 0 0 12px 12px; text-align: center; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido a Héroes Colombia!</h1>
      <p>Tu período de prueba ha comenzado</p>
    </div>
    <div class="content">
      <p>Hola <strong>${businessName}</strong>,</p>

      <p>¡Gracias por unirte a las marcas aliadas de Héroes Colombia! Tu pago ha sido procesado exitosamente y tu período de prueba ya está activo.</p>

      <div style="text-align: center;">
        <span class="trial-badge">Prueba Activa - 2 Meses</span>
      </div>

      <div class="details-card">
        <p style="margin: 0;"><strong>Tu prueba vence el:</strong> ${formattedEndDate}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Durante este período tendrás acceso a todas las funcionalidades Enterprise.</p>
      </div>

      <h3>¿Qué puedes hacer ahora?</h3>
      <ul class="feature-list">
        <li>Crear promociones exclusivas para miembros de Héroes Colombia</li>
        <li>Gestionar ubicaciones de tu negocio</li>
        <li>Ver estadísticas de redenciones</li>
        <li>Personalizar el perfil de tu negocio</li>
      </ul>

      <div style="text-align: center;">
        <a href="https://app.heroescolombia.com/business/dashboard" class="cta-button">
          Ir a mi Dashboard
        </a>
      </div>

      <div class="warning-box">
        <p style="margin: 0; font-size: 14px;">
          <strong>Importante:</strong> Al finalizar tu período de prueba, podrás convertirte en <strong>Fundador</strong> con precio especial de $480,000 COP/año. ¡Solo hay 100 lugares disponibles!
        </p>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este correo o escribiéndonos por WhatsApp.
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
  const adminSubject = `Nuevo Trial Activado - ${businessName}`
  const adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #7fa64e; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7e5; border-top: none; border-radius: 0 0 8px 8px; }
    .field { margin: 15px 0; }
    .label { font-weight: bold; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎉 Nuevo Trial Activado</h2>
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
        <div class="label">Monto:</div>
        <div>$20,000 COP</div>
      </div>
      <div class="field">
        <div class="label">Vencimiento:</div>
        <div>${formattedEndDate}</div>
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

// Subscription Activated Email (handles Fundador with special branding)
export async function sendSubscriptionActivatedEmail({
  email,
  businessName,
  plan,
  billingPeriod,
  nextPaymentDate,
  isFounder,
}: {
  email: string
  businessName: string
  plan: string
  billingPeriod: string
  nextPaymentDate?: string
  isFounder: boolean
}) {
  const planNames: Record<string, string> = {
    fundador: "Fundador",
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

  // Special subject for Founders
  const subject = isFounder
    ? `¡Bienvenido a los socios Fundadores de Héroes Colombia, ${businessName}!`
    : `¡Bienvenido al Plan ${planName} de Héroes Colombia!`

  // Special badge for Founders
  const founderBadgeHtml = isFounder
    ? `
      <div style="text-align: center; margin: 20px 0;">
        <div style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #78350f; padding: 12px 24px; border-radius: 30px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 14px rgba(251, 191, 36, 0.4);">
          ⭐ Fundador #${Date.now() % 100} ⭐
        </div>
      </div>
      <div style="background: #fffbeb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #92400e;">¡Felicitaciones! Eres parte del exclusivo Club Fundador</p>
        <ul style="margin: 0; padding-left: 20px; color: #78350f;">
          <li>Para siempre tendrás un precio especial como socio Fundador, este año es de $480,000 COP/año</li>
          <li>Acceso a todas las funcionalidades Enterprise</li>
          <li>Soporte prioritario directo con el equipo</li>
          <li>Reconocimiento especial en la plataforma</li>
        </ul>
      </div>
    `
    : ""

  const businessHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${isFounder ? "#f59e0b 0%, #d97706 100%" : "#5d7a3a 0%, #7fa64e 100%"}); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7e5; border-top: none; }
    .plan-badge { display: inline-block; background: ${isFounder ? "#fef3c7" : "#f0fdf4"}; color: ${isFounder ? "#92400e" : "#166534"}; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 10px 0; }
    .details-card { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7e5; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; }
    .detail-value { font-weight: 600; color: #1a1a1a; }
    .cta-button { display: inline-block; background: ${isFounder ? "#f59e0b" : "#5d7a3a"}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px 30px; border: 1px solid #e5e7e5; border-top: none; border-radius: 0 0 12px 12px; text-align: center; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isFounder ? "¡Bienvenido a los socios Fundadores!" : "¡Suscripción Activada!"}</h1>
      <p>${isFounder ? "Gracias por creer en Héroes Colombia desde el inicio" : "Gracias por confiar en Héroes Colombia"}</p>
    </div>
    <div class="content">
      <p>Hola <strong>${businessName}</strong>,</p>

      <p>${isFounder
      ? "¡Gracias por convertirte en uno de nuestros primeros 100 Fundadores! Tu apoyo temprano es fundamental para construir la comunidad de negocios aliados más grande de Colombia."
      : "Tu suscripción ha sido procesada exitosamente. Ya puedes disfrutar de todos los beneficios de tu plan."
    }</p>

      ${founderBadgeHtml}

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
          <span class="detail-label">Próxima renovación:</span>
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
  const adminSubject = isFounder
    ? `🎉 Nuevo Fundador - ${businessName}`
    : `Nueva Suscripción - Plan ${planName} (${periodLabel})`

  const adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${isFounder ? "#f59e0b" : "#7fa64e"}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7e5; border-top: none; border-radius: 0 0 8px 8px; }
    .field { margin: 15px 0; }
    .label { font-weight: bold; color: #6b7280; }
    .founder-badge { background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-weight: 600; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${isFounder ? "⭐ Nuevo Fundador Activado" : "💰 Nueva Suscripción Activada"}</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Negocio:</div>
        <div>${businessName} ${isFounder ? '<span class="founder-badge">Fundador</span>' : ""}</div>
      </div>
      <div class="field">
        <div class="label">Email:</div>
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
        <div class="label">Próxima renovación:</div>
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

// Trial Expiring Warning Email (sent 7 days before expiration)
export async function sendTrialExpiringEmail({
  email,
  businessName,
  daysRemaining,
  trialEndDate,
}: {
  email: string
  businessName: string
  daysRemaining: number
  trialEndDate: Date
}) {
  const formattedEndDate = trialEndDate.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const subject = `${businessName}, tu prueba vence en ${daysRemaining} dias`

  const businessHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7e5; border-top: none; }
    .countdown-box { background: #fffbeb; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; text-align: center; }
    .countdown-number { font-size: 48px; font-weight: bold; color: #f59e0b; }
    .feature-list { list-style: none; padding: 0; margin: 15px 0; }
    .feature-list li { padding: 8px 0; display: flex; align-items: center; }
    .feature-list li::before { content: "\\2713"; color: #f59e0b; font-weight: bold; margin-right: 10px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; font-size: 16px; }
    .footer { background: #f9fafb; padding: 20px 30px; border: 1px solid #e5e7e5; border-top: none; border-radius: 0 0 12px 12px; text-align: center; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tu periodo de prueba esta por vencer</h1>
      <p>Asegura tu lugar como Fundador</p>
    </div>
    <div class="content">
      <p>Hola <strong>${businessName}</strong>,</p>

      <div class="countdown-box">
        <div class="countdown-number">${daysRemaining}</div>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #92400e;">
          dias restantes (vence el ${formattedEndDate})
        </p>
      </div>

      <p>
        Tu periodo de prueba en Heroes Colombia esta por terminar. Despues del <strong>${formattedEndDate}</strong>,
        tu negocio y promociones no seran visibles en la app.
      </p>

      <h3 style="margin: 20px 0 10px 0;">Conviertete en Fundador y obten:</h3>
      <ul class="feature-list">
        <li>Precio de $480,000 COP/año</li>
        <li>Acceso a todas las funcionalidades Enterprise</li>
        <li>Soporte prioritario directo con el equipo</li>
        <li>Tu negocio visible para miles de usuarios</li>
      </ul>

      <div style="text-align: center;">
        <a href="https://app.heroescolombia.com/business/dashboard/plans" class="cta-button">
          Activar Plan Fundador - $480,000/año
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        Solo hay 100 lugares disponibles como Fundador. No pierdas esta oportunidad!
      </p>
    </div>
    <div class="footer">
      <p>2026 Heroes Colombia. Todos los derechos reservados.</p>
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
}

// Trial Expired Email (sent when trial has expired)
export async function sendTrialExpiredEmail({
  email,
  businessName,
}: {
  email: string
  businessName: string
}) {
  const subject = `${businessName}, tu periodo de prueba ha expirado`

  const businessHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7e5; border-top: none; }
    .warning-box { background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626; }
    .founder-box { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .feature-list { list-style: none; padding: 0; margin: 15px 0; }
    .feature-list li { padding: 8px 0; display: flex; align-items: center; }
    .feature-list li::before { content: "\\2713"; color: #f59e0b; font-weight: bold; margin-right: 10px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; font-size: 16px; }
    .footer { background: #f9fafb; padding: 20px 30px; border: 1px solid #e5e7e5; border-top: none; border-radius: 0 0 12px 12px; text-align: center; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tu periodo de prueba ha expirado</h1>
      <p>Pero no te preocupes, aun puedes activar tu plan</p>
    </div>
    <div class="content">
      <p>Hola <strong>${businessName}</strong>,</p>

      <div class="warning-box">
        <p style="margin: 0; font-weight: 600; color: #dc2626;">Tu negocio ya no es visible en la app de Heroes Colombia</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #7f1d1d;">
          Tus promociones no aparecen en la app y los usuarios no pueden ver tu negocio.
        </p>
      </div>

      <div class="founder-box">
        <h3 style="margin: 0 0 10px 0; color: #92400e;">Conviertete en Fundador</h3>
        <p style="margin: 0 0 15px 0; color: #78350f;">
          Asegura tu precio exclusivo de <strong>$480,000 COP/año</strong>.
        </p>
        <ul class="feature-list">
          <li>Precio especial para socios fundadores</li>
          <li>Acceso a todas las funcionalidades Enterprise</li>
          <li>Soporte prioritario directo</li>
          <li>Tu negocio visible para miles de usuarios</li>
        </ul>
        <p style="font-size: 14px; color: #92400e; margin: 10px 0 0 0;">
          Solo hay 100 lugares disponibles como Fundador!
        </p>
      </div>

      <div style="text-align: center;">
        <a href="https://app.heroescolombia.com/business/dashboard/plans" class="cta-button">
          Activar Plan Fundador
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este correo o escribiendonos por WhatsApp.
      </p>
    </div>
    <div class="footer">
      <p>2026 Heroes Colombia. Todos los derechos reservados.</p>
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
  const adminSubject = `Trial Expirado - ${businessName}`
  const adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7e5; border-top: none; border-radius: 0 0 8px 8px; }
    .field { margin: 15px 0; }
    .label { font-weight: bold; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Trial Expirado</h2>
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
      <p style="margin-top: 20px;">
        <a href="https://app.heroescolombia.com/admin/dashboard/businesses">Ver en admin</a>
      </p>
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
