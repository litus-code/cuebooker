export type BookingConversationEmailContext = {
  artistName: string
  bodyText: string
  locale?: 'es' | 'en'
  actionUrl?: string
  actionLabel?: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function renderBody(value: string) {
  return escapeHtml(value)
    .split(/\r?\n/)
    .map(line => line.trim()
      ? `<div style="margin:0 0 10px;">${line}</div>`
      : '<div style="height:8px;line-height:8px;">&nbsp;</div>')
    .join('')
}

function preheaderFromBody(value: string) {
  const compact = value.replace(/\s+/g, ' ').trim()
  return compact.length > 140 ? `${compact.slice(0, 137)}...` : compact
}

export function renderBookingConversationEmail(
  context: BookingConversationEmailContext
) {
  const artistName = context.artistName.trim() || 'Cuebooker'
  const safeArtistName = escapeHtml(artistName)
  const preheader = escapeHtml(preheaderFromBody(context.bodyText))
  const message = renderBody(context.bodyText)
  const locale = context.locale === 'en' ? 'en' : 'es'
  const actionUrl = context.actionUrl?.trim() || ''
  const actionLabel = context.actionLabel?.trim()
    || (locale === 'en' ? 'Open secure booking' : 'Abrir booking seguro')
  const action = actionUrl
    ? `<div style="margin:26px 0 4px;"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:14px 18px;background:#e8ff2f;color:#090909;text-decoration:none;font-size:12px;font-weight:900;letter-spacing:.02em;">${escapeHtml(actionLabel)}</a></div>`
    : ''
  const footer = locale === 'en'
    ? 'Sent from Cuebooker · Reply directly to this email to continue the conversation.'
    : 'Enviado desde Cuebooker · Responde directamente a este email para continuar la conversación.'

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#080808;color:#f2f0eb;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#080808;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #2b2b2b;background:#101010;">
            <tr>
              <td style="padding:20px 24px;border-bottom:1px solid #2b2b2b;">
                <div style="font-size:18px;font-weight:900;letter-spacing:-0.02em;color:#f2f0eb;">CUEBOOKER</div>
                <div style="margin-top:7px;font:700 10px/1.2 monospace;letter-spacing:.12em;text-transform:uppercase;color:#e8ff2f;">BOOKING · ${safeArtistName}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 24px 24px;">
                <div style="color:#f2f0eb;font-size:15px;line-height:1.6;">${message}</div>
                ${action}
              </td>
            </tr>
            <tr>
              <td style="padding:17px 24px 20px;border-top:1px solid #222;color:#777;font-size:11px;line-height:1.5;">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = actionUrl
    ? `${context.bodyText}\n\n${actionLabel}:\n${actionUrl}`
    : context.bodyText

  return {
    html,
    text
  }
}
