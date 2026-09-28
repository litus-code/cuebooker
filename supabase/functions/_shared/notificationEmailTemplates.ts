export type NotificationEmailKind =
  | 'booking_request_received'
  | 'promoter_reply_received'

export type NotificationEmailLocale = 'es' | 'en'

export type NotificationEmailContext = {
  kind: NotificationEmailKind
  locale?: NotificationEmailLocale
  recipientName?: string | null
  artistName: string
  bookingUrl: string
  contactName?: string | null
  organizationName?: string | null
  eventName?: string | null
  venueName?: string | null
  city?: string | null
  eventDate?: string | null
}

export type NotificationEmailTemplate = {
  subject: string
  preheader: string
  text: string
  html: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function detailLine(values: Array<string | null | undefined>) {
  return values.map(value => value?.trim()).filter(Boolean).join(' · ')
}

function shell(options: {
  preheader: string
  eyebrow: string
  title: string
  body: string
  detail?: string
  cta: string
  bookingUrl: string
  footer: string
}) {
  const preheader = escapeHtml(options.preheader)
  const eyebrow = escapeHtml(options.eyebrow)
  const title = escapeHtml(options.title)
  const body = escapeHtml(options.body)
  const detail = options.detail ? escapeHtml(options.detail) : ''
  const cta = escapeHtml(options.cta)
  const bookingUrl = escapeHtml(options.bookingUrl)
  const footer = escapeHtml(options.footer)

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#080808;color:#f2f0eb;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#080808;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #2b2b2b;background:#101010;">
            <tr>
              <td style="padding:22px 24px;border-bottom:1px solid #2b2b2b;">
                <div style="font-size:18px;font-weight:900;letter-spacing:-0.02em;">CUEBOOKER</div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 24px 18px;">
                <div style="font:700 10px/1.2 monospace;letter-spacing:.12em;text-transform:uppercase;color:#e8ff2f;">${eyebrow}</div>
                <h1 style="margin:12px 0 0;font-size:34px;line-height:1.02;letter-spacing:-0.035em;">${title}</h1>
                <p style="margin:18px 0 0;color:#c5c5c5;font-size:15px;line-height:1.55;">${body}</p>
                ${detail ? `<div style="margin:22px 0 0;padding:14px 16px;border:1px solid #303030;background:#0b0b0b;color:#f2f0eb;font-size:13px;line-height:1.45;">${detail}</div>` : ''}
                <div style="margin:28px 0 4px;">
                  <a href="${bookingUrl}" style="display:inline-block;padding:14px 18px;background:#e8ff2f;color:#080808;text-decoration:none;font-weight:900;font-size:13px;">${cta}</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px 24px;color:#777;font-size:11px;line-height:1.45;border-top:1px solid #222;">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function renderNotificationEmail(context: NotificationEmailContext): NotificationEmailTemplate {
  const locale: NotificationEmailLocale = context.locale === 'en' ? 'en' : 'es'
  const recipientName = context.recipientName?.trim()
  const contactName = context.contactName?.trim()
  const organizationName = context.organizationName?.trim()
  const detail = detailLine([
    context.eventName,
    context.venueName,
    context.city,
    context.eventDate
  ])

  if (context.kind === 'booking_request_received') {
    const subject = locale === 'en'
      ? `New booking request · ${context.artistName}`
      : `Nueva solicitud de booking · ${context.artistName}`
    const preheader = locale === 'en'
      ? `${contactName || organizationName || 'A promoter'} has sent a new booking request.`
      : `${contactName || organizationName || 'Un promotor'} ha enviado una nueva solicitud de booking.`
    const greeting = recipientName ? (locale === 'en' ? `Hi ${recipientName},` : `Hola ${recipientName},`) : ''
    const body = locale === 'en'
      ? `${greeting ? greeting + ' ' : ''}A new booking request for ${context.artistName} has arrived in Cuebooker. Review the details and decide the next move when you are ready.`
      : `${greeting ? greeting + ' ' : ''}Ha entrado una nueva solicitud para ${context.artistName}. Revisa los detalles y decide el siguiente movimiento cuando te vaya bien.`
    const cta = locale === 'en' ? 'Open booking' : 'Ver solicitud'
    const footer = locale === 'en'
      ? 'Cuebooker keeps your booking conversations and follow-up in one place.'
      : 'Cuebooker mantiene tus solicitudes, conversaciones y seguimiento en un solo sitio.'
    const text = [
      subject,
      '',
      body,
      ...(detail ? ['', detail] : []),
      '',
      `${cta}: ${context.bookingUrl}`,
      '',
      footer
    ].join('\n')

    return {
      subject,
      preheader,
      text,
      html: shell({
        preheader,
        eyebrow: locale === 'en' ? 'NEW BOOKING' : 'NUEVO BOOKING',
        title: locale === 'en' ? 'A new request just landed.' : 'Te acaba de entrar una solicitud.',
        body,
        detail,
        cta,
        bookingUrl: context.bookingUrl,
        footer
      })
    }
  }

  const subject = locale === 'en'
    ? `New reply · ${context.artistName}`
    : `Nueva respuesta · ${context.artistName}`
  const preheader = locale === 'en'
    ? `${contactName || organizationName || 'The promoter'} replied to the booking conversation.`
    : `${contactName || organizationName || 'El promotor'} ha respondido a la conversación.`
  const greeting = recipientName ? (locale === 'en' ? `Hi ${recipientName},` : `Hola ${recipientName},`) : ''
  const body = locale === 'en'
    ? `${greeting ? greeting + ' ' : ''}There is a new reply on the booking for ${context.artistName}. Open the conversation to see the message and keep the follow-up moving.`
    : `${greeting ? greeting + ' ' : ''}Tienes una nueva respuesta en el booking de ${context.artistName}. Abre la conversación para ver el mensaje y seguir con el seguimiento.`
  const cta = locale === 'en' ? 'Open conversation' : 'Ver conversación'
  const footer = locale === 'en'
    ? 'You are receiving this because you are part of the workspace handling this booking.'
    : 'Recibes este aviso porque formas parte del workspace que gestiona este booking.'
  const text = [
    subject,
    '',
    body,
    ...(detail ? ['', detail] : []),
    '',
    `${cta}: ${context.bookingUrl}`,
    '',
    footer
  ].join('\n')

  return {
    subject,
    preheader,
    text,
    html: shell({
      preheader,
      eyebrow: locale === 'en' ? 'NEW REPLY' : 'NUEVA RESPUESTA',
      title: locale === 'en' ? 'The conversation moved.' : 'La conversación se ha movido.',
      body,
      detail,
      cta,
      bookingUrl: context.bookingUrl,
      footer
    })
  }
}
