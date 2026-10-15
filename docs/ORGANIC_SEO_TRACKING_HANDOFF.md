# SEO orgánico y medición — Cuebooker

Actualización: 14 octubre 2026. Alcance: /, /dj, /agency, solo rama feature/landings-dj-agency-home21.

## Cambios técnicos incluidos
- Canonical específico para /, /dj y /agency; eliminada la canonical global a /, que era incorrecta para páginas individuales.
- Title, meta description y Open Graph/Twitter de DJ y Agency adaptados al público objetivo y al idioma activo.
- Sitemap público incorpora /dj y /agency.
- Se conservan titulares de marketing y diseño aprobados.
- No se instalaron Meta Pixel ni TikTok Pixel ni se realizó despliegue en producción.

## Puntos pendientes antes de publicar
1. Verificar resultado de CI y render HTML prerenderizado en /, /dj, /agency, especialmente title, description, canonical y open graph.
2. Revisar si el cambio ES/EN en la misma URL mediante cliente produce metadatos solo españoles para el crawler. No declarar posicionamiento bilingüe hasta disponer de rutas localizadas y hreflang correctamente configurados.
3. Confirmar acceso a Google Search Console y verificar propiedad de dominio cuebooker.com mediante método aprobado, añadir sitemap https://cuebooker.com/sitemap.xml tras producción, inspeccionar las 3 URLs e indexabilidad.
4. Auditar robots, rutas privadas/noindex, mobile, Core Web Vitals, URLs públicas y estado HTTP.
5. Mapear consultas de Search Console y separar intención DJ / agency. Las frases SEO actuales son hipótesis, no volúmenes de búsqueda validados.
6. Validar GTM -> GA4 con consentimiento, sin duplicar page_view. La captura de UTM al registro está disponible; verificar persistencia de fuente hasta signup_completed y activación.
7. Configurar informe semanal: impresiones, clics orgánicos, CTR, consultas, landing, signup_click, signup_completed, artist_profile_published, booking_request_sent. Diferenciar eventos consentidos de métricas operacionales completas.
8. No añadir píxeles de publicidad ni asumir coste; campaña inicial 100% orgánica.

## Copy SEO de las landings
- ES /dj: Gestión de bookings para DJs | Cuebooker.
- ES /agency: Software de booking para agencias | Cuebooker.
- EN /dj: DJ Booking Management Software | Cuebooker.
- EN /agency: Booking Software for Music Agencies | Cuebooker.

## Activación orgánica
Usar parámetros utm_source, utm_medium=organic, utm_campaign al difundir enlaces en Instagram, networking y contenido propio. Evitar información personal o mensajes en telemetría.
