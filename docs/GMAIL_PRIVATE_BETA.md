# Gmail directo: beta privada, Tarea 2

4 de octubre de 2026. Destino acordado: beta privada en producción, después de comprobarla en staging. Esta implementación no activa conexiones sin configuración ni sustituye los datos de Nylas. Tarea 3 añade el filtro anterior a IA y el fallback RFC descritos al final de este documento.

## Contrato y seguridad

Nuxt 4 / Vue 3; Supabase Auth, PostgreSQL y Edge Functions; Brevo para avisos de admisión; Groq para análisis autorizado. Gmail usa REST mediante fetch, con scopes `https://www.googleapis.com/auth/gmail.readonly` y `https://www.googleapis.com/auth/gmail.send`. No se solicitan calendario, contactos ni modificación/eliminación de mensajes.

OAuth offline con PKCE S256, estado aleatorio de un solo uso, hash guardado durante diez minutos y finalización con la sesión Cuebooker que inició la operación. La aprobación previa se comprueba en el servidor y el correo de `users.getProfile` debe coincidir exactamente con la solicitud. Los permisos concedidos deben incluir ambos scopes.

Los tokens y el verificador PKCE se cifran con AES-256-GCM y un secreto Edge independiente de las firmas de Supabase Auth. Los datos asociados al cifrado contienen workspace, usuario y correo; el verificador se liga al hash del estado. La clave y los tokens nunca pasan al frontend, a logs ni a documentos. La tabla de credenciales tiene RLS, permisos sólo para service_role y ningún acceso de clientes.

Se conserva el plazo inicial de siete días de Testing aunque se renueve el access token. `invalid_grant`, HTTP 401 o ese plazo marcan `reauth_required`; la UI muestra «Requiere autorización». Un fallo temporal no se presenta como autorización caducada. No se reintenta automáticamente un envío ambiguo: el registro existente de intentos conserva su protección frente a duplicados.

Las conexiones existentes mantienen IDs y hilos Nylas. La unicidad nueva incluye transport; conectar Gmail con el mismo correo crea una conexión distinta y no migra automáticamente hilos del proveedor anterior. La reconexión Gmail del mismo usuario/workspace/correo conserva su propio ID. Los cambios se guardan juntos en una función SQL que revalida actor, estado y admisión.

Las respuestas Gmail usan su threadId, el Message-ID RFC del mensaje anterior, References/In-Reply-To y el asunto original. El receptor sigue procediendo del contacto del booking, nunca de una dirección arbitraria enviada desde el navegador. MIME se convierte a texto; no se descargan adjuntos.

## Configuración privada por entorno

| Ajuste Edge | Valor / finalidad |
| --- | --- |
| `GMAIL_CLIENT_ID` | Cliente OAuth web del proyecto Google correspondiente |
| `GMAIL_CLIENT_SECRET` | Secreto del cliente, entrada privada directa |
| `GMAIL_TOKEN_ENCRYPTION_KEY` | 32 bytes aleatorios codificados base64/base64url; custodiar para descifrar registros existentes |
| `CUEBOOKER_MAILBOX_TRANSPORT` | `gmail` por defecto; `nylas` sólo para pruebas explícitas de la ruta anterior |
| `CUEBOOKER_MAILBOX_ENABLED` | Activar sólo después de preparar el cliente y comprobar OAuth |
| `CUEBOOKER_MAILBOX_RETURN_URL` | URL workspace permitida del mismo entorno |
| `GMAIL_PUBSUB_TOPIC` | `projects/PROYECTO/topics/cuebooker-gmail-ENTORNO` |
| `GMAIL_PUBSUB_SUBSCRIPTION` | Nombre completo de la suscripción push de ese entorno |
| `GMAIL_PUSH_SERVICE_ACCOUNT` | Email exacto de la cuenta de servicio que firma los avisos push |
| `MAILBOX_WORKER_SECRET` | Secreto privado para los dos workers, nunca credencial del cliente |
| `CUEBOOKER_MAILBOX_BACKGROUND_ENABLED` | Mantener apagado hasta verificar Pub/Sub, workers y consentimiento |

Usar clientes separados para staging y producción, con sus redirect URI exactos:

- Staging: `https://lycprjeuuynfzwskycwv.supabase.co/functions/v1/connected-mailbox`
- Producción: `https://qlocooqfdzehogbwcbhr.supabase.co/functions/v1/connected-mailbox`

En Google Cloud: habilitar Gmail API, configurar audiencia External / Testing y los dos scopes, añadir manualmente las cuentas de prueba, crear cliente tipo Web application y registrar el redirect del entorno. No pegar secretos en chat. Testing permite una cohorte limitada y reconexión periódica; no representa verificación ni exención comercial permanente. La lectura Gmail es un scope restricted; la salida de Testing necesita revisar los requisitos Google antes de ofrecer conexión abierta.

## Avisos entrantes y watch

Crear el topic en el mismo proyecto del cliente OAuth. Conceder Pub/Sub Publisher a `gmail-api-push@system.gserviceaccount.com` únicamente en ese topic. Crear una suscripción push con autenticación OIDC mediante una cuenta de servicio dedicada, sin claves JSON descargadas. Configurar push endpoint y audience como `https://REF.supabase.co/functions/v1/gmail-mailbox-events`; guardar nombre de suscripción y cuenta de servicio en los secretos del mismo entorno. Permisos para crear la suscripción/token: seguir la documentación Google sobre service account user y el service agent Pub/Sub; no conceder roles amplios por conveniencia.

`gmail-mailbox-events` comprueba firma RS256 con claves públicas de Google, issuer, audience, email verificado de la cuenta de servicio, caducidad y suscripción exactos. Sólo guarda email/historyId; el ID de entrega Pub/Sub nunca se trata como ID de un correo Gmail. Eventos repetidos/desordenados conservan el mayor cursor pendiente. Errores de almacenamiento devuelven 503 para permitir redelivery.

`process-gmail-history` usa permiso explícito y membresía actual antes de leer correos y después de operaciones lentas. Al iniciar crea un watch y su cursor base; no reproduce el historial anterior. Consulta history.list, excluye enviados/spam/papelera/borradores, comprueba fecha de consentimiento y entrega IDs reales a la cola existente. Esa cola deduplica por conexión/mensaje. Los hilos existentes usan el mismo Booking Core y el worker existente; esta tarea no altera la clasificación IA.

La renovación ocurre cuando falta menos de un día de vigencia y hay recuperación periódica tras una hora sin actividad, incluso si se pierde un push. Se procesan como máximo cinco páginas de veinte entradas en cada intento. El cursor guardado sólo avanza al completar la lectura y admitir los mensajes: una cola llena no pierde el cursor. El trabajo tiene lease de cinco minutos con token y revisión del consentimiento para impedir que un worker antiguo complete un trabajo nuevo. Un historial caducado o un backlog fuera del límite queda en `resync_required`, visible en UI; el usuario puede retirar/reactivar consentimiento para empezar desde nuevos mensajes. No se inventa una importación completa del historial.

El cron `cuebooker-gmail-history` se instala **pausado**. Antes de activarlo, crear privadamente Vault `cuebooker_gmail_history_worker_url` (endpoint process-gmail-history) y el existente `cuebooker_mailbox_worker_secret`. El cron de process-mailbox-incoming también necesita su URL/secreto y activación comprobada; instalar funciones no lo activa. Retirar consentimiento bloquea lecturas/análisis y se intenta detener watch; los avisos metadata que lleguen después no se admiten. Desconectar revoca Google y borra los tokens locales, conservando Bookings.

## Validación y promoción

Pruebas ficticias cubren cifrado/tenant, PKCE y permisos parciales, caducidad y refresh, MIME, headers/hilos, envío ambiguo, JWT firmado/firma alterada/cuenta-audiencia incorrectas, paginación, duplicados, revocación y errores de cola/historial. SQL smoke transaccional verifica permisos, aprobación, conexión Gmail separada de Nylas, token del lease y retirada de consentimiento; siempre rollback, sin envíos ni buzones reales.

El recorrido real de staging pasó el 4 de octubre de 2026; ver la evidencia siguiente. Quedan por comprobar renovación real del watch, caducidad de Testing, recuperación de límites del proveedor y capacidad con más usuarios. Producción sigue separada: rehearsal aislado del manifiesto completo de 30 migraciones, backend/configuración y promoción de la misma revisión/version Beta revisada tras los controles de lanzamiento.

Documentación primaria:

- https://developers.google.com/workspace/gmail/api/auth/scopes
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/workspace/gmail/api/guides/threads
- https://developers.google.com/workspace/gmail/api/guides/push
- https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.history/list
- https://docs.cloud.google.com/pubsub/docs/authenticate-push-subscriptions
- https://support.google.com/cloud/answer/15549945

## Tarea 3: filtro y continuación por referencias RFC

El worker da prioridad a los hilos vinculados. El filtro determinista conserva mensajes automáticos/listas para revisión sin consumir análisis; reconoce informes MIME de entrega. Los remitentes genéricos, mensajes cortos, falta de keywords y formularios automáticos no causan descarte. El análisis manual mantiene su contrato.

Para respuestas con otro threadId, Gmail busca IDs RFC de In-Reply-To/References (máximo diez referencias de sintaxis conservadora, cinco resultados por referencia) y verifica el Message-ID de cada resultado. El servidor exige que el ID de proveedor ya exista en email_messages de la misma conexión y workspace, y que el remitente corresponda al interlocutor del mensaje guardado. El namespace de persistencia heredado nylas:connection_id identifica ambas rutas y no debe reinterpretarse como el transporte actual. Una relación única se guarda con el ingest existente y su control de acceso/archivo. Conflictos, referencias no reconocidas o límites excedidos requieren revisión, nunca crean otra solicitud por ese camino. No se guarda un índice de headers RFC ni se migran hilos Nylas.

Pruebas sintéticas no sustituyen la comprobación real de entrega y respuesta. Ver HANDOFF.md para SHA/CI/despliegue efectivamente verificados. Fuente API: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list

## 2026-10-04: new-mail automation and plain consent

Connect once, explicitly authorize bounded Groq analysis, then capture new inbox enquiries automatically from activation. Do not scan mailbox history as an onboarding step. Reviewing earlier messages is a separate, visibly clickable, optional action with per-message analysis consent. Opening Reservations performs no account-wide mail read. Known booking threads continue to synchronize before classification. No automatic replies or confirmations.

OAuth binds the chosen processor inside encrypted PKCE state. Completion cannot add consent from browser input. Gmail watch is registered before consent/cursor are committed atomically by start_gmail_mailbox_detection. Repeated enable calls preserve the original cursor. Missing baselines require explicit repair, never silently restart from a newer cursor. Connected, starting, active, paused and reconnect states remain distinct; active requires current consent/watch revision, unexpired watch and recent successful worker health.

Explicit Groq 429 rejection retains the incoming job for a paced automatic retry (2 to 15 minutes). Ambiguous provider/model outcomes and quota rejection are not automatically retried. This is analysis only, never sending. The UI exposes retained pending work and failures. The smaller model completion budget and low reasoning effort reduce token pressure; they are not evidence of a successful live model call.

Before beta invitations: configure Google app identity, verified domain and privacy/terms URLs so consent no longer relies on the technical Supabase hostname. Confirm provider DPAs, purposes, retention, deletion handling, international transfer safeguards and actual Groq data handling/training terms. The public privacy text describes implemented access, but does not certify RGPD compliance. Google grants mailbox reading and user-directed sending: never claim Cuebooker has no mailbox access. Groq receives only the subject and up to 2,500 body characters, no attachment downloads. Authorized workspace members see saved booking conversations. Disconnect removes local credentials and attempts Google revocation; saved booking records remain. AI cache entries expire after 24 hours and are removed during subsequent analysis operations.

Activation acceptance completed in staging as recorded below. Provider rate-limit recovery under real load, time-based renewal/expiry and the isolated 30-migration rehearsal remain outstanding. Invitations require the privacy/Google checks above; production has not been changed.


## Aceptación real de staging: 4 de octubre de 2026

Pruebas del propietario con su cuenta autorizada, desde iPhone en PR96/Beta0.0.3. Horas Europe/Madrid. No se publican cuerpos, tokens ni direcciones de interlocutores. Capturas del propietario y comprobaciones de estado/cola en staging respaldan estos resultados.

| Prueba | Evidencia | Resultado |
| --- | --- | --- |
| Activación 21:55:53 | Watch listo, cursor base y revisión del consentimiento coincidentes | Nuevos mensajes desde activación |
| Propuesta nueva | Cola 21:59:01, finalización 22:00:01; clasificación booking y Booking creado; contador 6 a 7 | Automático sin pulsar analizar |
| Correo sin propuesta | Cola 22:08:01, finalización 22:09:01; clasificación other sin Booking | Ignorado para reservas |
| Respuesta del usuario | Salida sent 22:18:23; receptor confirma entrega | Envío solicitado funciona |
| Respuesta del interlocutor | Recibida 22:21:19, sincronizada 22:23:01 en Booking original | Sin Booking duplicado |
| Pausa y correo nuevo 22:26 | Consentimiento retirado; ningún trabajo Gmail nuevo durante la pausa | No analizado |
| Reactivación 22:27:19 | Nuevo cursor base/revisión; sin trabajo del correo de la pausa | Reinicio desde nuevos mensajes |
| Desconexión 22:29 | Estado disconnected, análisis apagado, credenciales locales ausentes | Confirmado; quedan metadatos watch |
| Reconexión 22:30:15 | connected, consentimiento activo y watch listo; propietario confirma | Funciona |

Pub/Sub autenticado activo: topic `projects/cuebooker/topics/cuebooker-gmail-staging`, suscripción `projects/cuebooker/subscriptions/cuebooker-gmail-staging-push`, cuenta `cuebooker-gmail-push-staging@cuebooker.iam.gserviceaccount.com`. Captura Google confirma endpoint y audience exactos de staging y envoltorio JSON. Publisher y Token Creator fueron guardados por el propietario; no se consultó la política completa mediante API autenticada Google.

Gate background activado sólo en staging. Cron `cuebooker-mailbox-incoming` y `cuebooker-gmail-history` activos cada minuto, con URLs Vault del mismo entorno. POST sin firma al webhook devuelve 401. Esto no demuestra por sí solo el flujo autenticado; la recepción real registrada arriba sí completa esa aceptación. Los bundles Edge mantienen los hashes revisados; cambios de secretos incrementaron las versiones observadas a connected-mailbox47, incoming24, history12 y events11.

No se verificó el resultado externo de revocación Google ni una renovación/expiración después de siete días. Producción permanece sin cambios. [Procedimiento repetible de configuración Google](GMAIL_PUSH_SETUP.md).

## 15 October 2026: bounded schema fallback and automatic attachment candidate

Source correction on PR96, not a backend deployment or a new hosted Gmail acceptance. The previous HEAD `316fc06d6a45fd5c9bc03d4589f65fd2ba68ccc0` had successful CI/preview. All 542 baseline tests passed before changes. Current validation and exact implementation commit are recorded in HANDOFF.md.

Groq strict-schema requests permit one JSON-object fallback only for explicit `invalid_json_schema`, `json_schema_validation_error` or `unsupported_response_format` codes. Unknown/generic 400, unsupported model and `json_validate_failed` do not retry. No fallback for 429/413/network errors; the pre-existing bounded 413 batch splitting and explicit rate-limit queue remain separate. Object mode includes the full JSON output schema in the instruction; both modes use the same local ID/field/draft validation. Failed/malformed/truncated output cannot create a booking. Classifier/cache version advanced to v5 so older results are not silently reused with the new contract. Logs expose allowlisted categories, not provider messages or generated contents.

Automatic attachment candidate (enabled only by the existing server flag) supports Gmail attachment IDs and named inline MIME bodies. PDFs, PNGs and JPEGs are bounded to ten files and 5 MiB each. Declared MIME, complete magic signature and declared/decoded size must agree. Attachment bodies are never sent to Groq. Linked-thread replies now save files after deterministic conversation ingestion, without reclassification or a new booking. Already stored metadata skips repeated downloads/uploads; object paths remain deterministic. Consent revision, processor, cutover time, editable workspace membership and the exact persisted inbound message/booking/connection are rechecked before file access and again before upload/metadata. Metadata binds email_message_id for the original conversation.

Partial file failures return `created_attachments_pending` / `synced_attachments_pending` and structured counts/failure stages. They do not mark a committed booking failed, retry classification or automatically requeue jobs. **These outcomes/logs are not a durable attachment retry queue or a new UI incident indicator.** Interrupted uploads can leave a private object without metadata; reconciliation/cleanup and safe manual recovery must be checked against the hosted implementation before beta readiness. Unsupported or oversized files are counted as skipped.

### Dependency drift blocks deployment and live acceptance

This checkout references `booking_email_attachments`, private bucket `booking-email-attachments`, and Edge Functions `recover-mailbox-attachments` / `get-booking-email-attachment`, but contains neither their schema migrations nor those two function implementations. Historical context says they exist in staging; it is not a substitute for inspecting deployed source, unique constraints, RLS and bucket settings. No Supabase authenticated connector or staging credentials are available in this cloud session. No backend, secret, flag, scheduler, migration or paid service was changed.

Before deploying to **lycprjeuuynfzwskycwv only**:

1. Confirm project identity. Retrieve current `process-mailbox-incoming`, `connected-mailbox`, `process-gmail-history` bundles and JWT settings for comparison/rollback. All consume changed shared modules; retrieve the separate document recovery/download functions too. Do not replace a live bundle blindly with an older repository snapshot.
2. Reconcile missing attachment SQL/function sources into version control from the actual deployed definitions. Verify private bucket, 5 MiB/MIME settings, workspace/booking/connection foreign keys, RLS and uniqueness on connection/message/attachment index. Verify metadata includes email_message_id and inspect orphan cleanup/recovery semantics. Do not guess an IF NOT EXISTS schema or broaden permissions to make the write pass.
3. Check the existing diagnostics migration/function compatibility and the current attachment/background flags without printing secret values. Keep existing gates/authentication and user consent. Do not bulk-retry historical failed jobs.
4. Deploy reviewed dependency-complete bundles and verify version/source hashes. An unauthenticated denial alone cannot prove classification, storage or Gmail operation.
5. With an authorized dedicated test mailbox, send one new enquiry with a PDF and PNG/JPEG; prove one booking, one inbound message, matching metadata/objects and document access in that booking. Repeat delivery/recovery to prove uniqueness. Send a reply with a second document and verify the original booking. Check unrelated mail, explicit rate/quota cases, pause/revocation and cross-workspace/viewer denials. Test DJ and agency assignment separately; automatic capture does not send or confirm.
6. Record provider delivery, notification/conversation, hold/confirmation/calendar and storage evidence without private content. Refresh release gates only for tests actually executed. Real delivery, deployed RLS/concurrency and the release gate remain unverified by local fixtures.

Local verification: 556 passing tests, a real Edge-handler integration with mocked HTTP/SQL boundaries (schema rejection → validated draft → single booking → PDF/inline image → same-booking reply → partial storage error), production build (40 routes), and Deno checks of all affected entrypoints/dependency consumers. No live model quota or email was used by these tests.
