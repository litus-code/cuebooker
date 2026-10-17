> Actualización 4 octubre 2026, cuenta Nylas inspeccionada: Pro anual figura a 516 USD/año; Accelerator figura como complemento opcional de 2400 USD/año e incluye Google Shared OAuth App. Total base de esa ruta: 2916 USD/año, antes de impuestos/extras. Esto resuelve la incertidumbre de inclusión/precio descrita en el estudio original. No se ha contratado. El propietario aprueba avanzar hacia una beta privada con correo real, conservando ambos perfiles. Ver PRIVATE_BETA_EXECUTION.md. La primera alternativa mensual a comprobar es Unipile; su alcance real en nuestra cuenta sigue sin validarse.

# Estudio de conexión de correo para Cuebooker

Fecha: 4 de octubre de 2026, Europe/Madrid. Investigación documental y revisión del código existente; no prueba comparativa de rendimiento ni contratación. Precios publicados, sujetos a impuestos, condiciones de cuenta y confirmación comercial. Recomendaciones del agente, pendientes de decisión del propietario.

## Decisión recomendada

Conservar Nylas para la evaluación actual, no pagar todavía y no migrar por el precio de portada de otro proveedor. Resolver primero la autorización real de Gmail en producción y su coste total. Si Essentials mensual permite el flujo necesario con un proyecto propio ya verificado, Nylas resulta razonable para los primeros 10–25 buzones. No asumir que pagar 15 USD permite lanzar Gmail públicamente.

Si la única vía práctica de Nylas exige Pro anual y Accelerator, no contratarla automáticamente: comprobar el importe completo y valorar una prueba técnica aislada de Unipile mensual. Aurinko es una alternativa a estudiar al crecer, sobre todo si Cuebooker ya dispone de OAuth propio verificado. Nango merece una prueba si confirma que su aplicación compartida permite en producción los permisos exactos que necesitamos. EmailEngine y conectores directos no son la primera opción en esta fase.

El resto de Cuebooker puede avanzar por su proceso de publicación con conexión de buzones desactivada hasta superar sus requisitos. Eso conserva la función como objetivo y evita presentarla como disponible sin estar preparada. La publicación completa sigue teniendo sus comprobaciones de backend, correo de plataforma y restauración; este estudio no las sustituye ni autoriza una contratación.

## Qué necesita el producto

Un DJ o agencia debe conectar su buzón existente, detectar propuestas, revisar datos extraídos y responder manteniendo el remitente y el hilo. Los requisitos son lectura acotada de mensajes, carpetas, notificaciones, paginación, respuesta en hilo, revocación, reconexión, aislamiento entre usuarios y presupuesto de uso. El calendario de Cuebooker no obliga a sincronizar calendarios externos para esta primera versión.

Brevo cubre mensajes de la plataforma y respuestas al formulario público. No reemplaza el acceso autorizado a un Gmail u Outlook personal. Una dirección nueva para Cuebooker o reenviar mensajes puede servir como alternativa limitada, pero no reproduce la detección automática en el buzón existente ni garantiza continuar el hilo desde ese remitente. No debe venderse como equivalente.

En la agencia actual, la conexión es personal al usuario y workspace. No existe todavía una bandeja delegada que todos los agentes puedan utilizar. Un roster de 20 artistas no implica por sí mismo 20 buzones: el coste depende de las cuentas de correo conectadas. Tampoco un proveedor con soporte de buzones compartidos convierte automáticamente nuestra interfaz en una bandeja compartida.

## Estado comprobado en Cuebooker

- Nylas Sandbox funciona en staging: hay evidencia de conexión y recepción de notificaciones. La aplicación observada está en región US y la cuenta muestra plan Free. La interfaz bloquea crear aplicaciones fuera de Sandbox sin ampliar el plan.
- El adaptador `supabase/functions/_shared/nylasMailbox.ts` encapsula detección del proveedor, autorización, intercambio, estado, mensajes, carpetas, envío y desconexión. Solicita Gmail `gmail.readonly` y `gmail.send`; Microsoft `Mail.ReadWrite` y `Mail.Send`, entre otros permisos de identidad y sesión.
- `connected-mailbox`, el procesador de entrada y el receptor de webhooks usan ese adaptador o formatos Nylas. Las migraciones incluyen identificadores de grant, hilo y mensaje, además de metadatos con proveedor Nylas. El modelo de Booking es aprovechable, pero cambiar de proveedor requiere más que sustituir una URL.
- Las alternativas de este documento no se han conectado a Cuebooker. No se ha contratado ningún servicio ni modificado producción como resultado del estudio.

## El factor que decide: Gmail público

Google clasifica la lectura general de Gmail como permiso restringido. Para almacenar o transmitir esos datos desde servidores puede exigir evaluación de seguridad, además de verificación OAuth, salvo excepciones aplicables. Pedir solo lectura reduce permisos, pero no elimina esa clasificación. Un complemento que actúa sobre el mensaje abierto tiene otro alcance y tampoco sustituye nuestro proceso de detección en segundo plano. [G1]

Nylas documenta una aplicación de Google compartida y verificada accesible en Pro anual mediante Accelerator, o como complemento Enterprise. La página de precios presenta Accelerator como incluido/desbloqueado en Pro anual; la guía habla de añadirlo. No está confirmado el importe final, su inclusión efectiva en esta cuenta ni su alcance contractual. Pro anual figura desde 43 USD/mes: equivalencia de 516 USD por 12 meses antes de posibles extras, no una propuesta comercial completa. [N2, N1]

Aurinko confirma explícitamente que no ofrece aplicación compartida verificada de Google: cada cliente gestiona su propio OAuth y verificación. [A2]

Nango documenta aplicaciones compartidas que también pueden funcionar en producción, pero con permisos fijos, riesgo de revocación y menor portabilidad. No hemos comprobado que su aplicación Gmail concreta cubra lectura, respuesta y notificaciones con las condiciones necesarias. Esto es una opción pendiente, no un descarte ni una garantía de Gmail gratuito. [NG2]

Unipile documenta que usa sus credenciales OAuth de Google por defecto y permite credenciales propias para mostrar nuestra marca. Es una alternativa concreta para evaluar una entrada sin OAuth propio; debemos confirmar por escrito lectura/envío, autorización pública, posibles extras y el alcance de sus revisiones. No se debe adoptar como garantía automática para todo el tratamiento de Cuebooker. [U2]

## Comparación económica

### Precios base

| Alternativa | Publicación de precio | Lectura práctica |
|---|---|---|
| Nylas Essentials | 15 USD/mes, 10 cuentas; 2,25 USD por adicional | Bajo coste inicial si la autorización de producción está resuelta |
| Nylas Pro mensual | 49 USD/mes, 25 cuentas; 2 USD por adicional | Desde 26 cuentas empata/supera a Essentials en coste; sin inferir acceso a Google Shared App |
| Aurinko Email | 1,50 USD por cuenta activa/mes, correo no IMAP hasta 1 GB | La FAQ específica corrige el «desde 1 USD» genérico de portada |
| Aurinko Full Platform | 2 USD por cuenta activa/mes, incluye IMAP | Puede eliminar la ventaja económica por buzón |
| EmailEngine | 1.200 EUR/año, software alojado por nosotros | 100 EUR/mes equivalentes, más servidor y operación; no pago mensual confirmado |
| Nango | Free: 10 conexiones, 10 horas y 10 GB mensuales; pago: mínimo 50 USD/mes en créditos | Pago por conexión, cómputo y transferencia; necesita medir el uso real |
| Unipile | 49 EUR/mes hasta 10 cuentas; escalas por cuenta después | Más caro por buzón, pero mensual y con una vía OAuth propia del proveedor |

Fuentes: [N1], [A1], [E1], [NG1], [U1]. No convertir monedas sin tipo de cambio ni mezclar cifras EUR y USD como si fueran iguales. No incluir supuestas tarifas de asesores Google.

### Escenarios de buzones facturables

USD/mes. Nylas usa el menor precio entre Essentials y Pro mensual. Aurinko usa las tarifas de su FAQ. Se excluyen Google Shared App, impuestos, evaluación OAuth, infraestructura, IA y migración. Se suponen condiciones y uso que encajan en cada tarifa: no es la factura completa de producción.

| Buzones | Nylas mensual | Aurinko correo no IMAP | Aurinko con IMAP/plataforma |
|---:|---:|---:|---:|
| 5 | 15,00 | 7,50 | 10,00 |
| 10 | 15,00 | 15,00 | 20,00 |
| 25 | 48,75 | 37,50 | 50,00 |
| 50 | 99,00 | 75,00 | 100,00 |
| 100 | 199,00 | 150,00 | 200,00 |
| 500 | 999,00 | 750,00 | 1.000,00 |

Fórmulas: Essentials = 15 + 2,25 × max(0, n−10); Pro mensual = 49 + 2 × max(0, n−25). Aurinko = 1,50n o 2n. Cálculos propios con [N1, A1]. Los 5 buzones aquí son una hipótesis de servicio pagado: el Sandbox gratuito no se equipara a producción.

La diferencia a 100 cuentas es 49 USD/mes para correo sin IMAP. Un gasto hipotético de migración de 1.000 USD tardaría unos 20,4 meses en amortizarse solo con ese ahorro; a 500 cuentas, unos cuatro meses. Ese importe es un ejemplo para decidir, no una valoración de horas ni una estimación contratada. Si aumenta el plan necesario para OAuth, hay que recalcular toda la comparación.

Nylas cuenta grants existentes durante el mes, incluso inválidos, y distintas aplicaciones pueden generar cargos separados; borrar no elimina el coste de ese mes. [N3] Aurinko define actividad por superar 10 llamadas o 1 MB, deduplica el mismo buzón y cobra el mes aunque después se desconecte. [A1] Unipile factura el pico simultáneo e incluye cuentas de desarrollo. [U3] Un límite de conexiones de Cuebooker no controla por sí solo todos esos casos.

## Valoración técnica y de operación

| Alternativa | Encaje | Trabajo y riesgo que quedan |
|---|---|---|
| Mantener Nylas | Mejor continuidad con el código actual | Resolver OAuth real, región, condiciones y pruebas pendientes; seguir conciliando grants |
| Aurinko | API de correo unificada, sincronización incremental y proveedores amplios [A3] | Adaptar formato de mensajes, cursores, hilos, eventos y autorización; OAuth propio |
| Nango | Autorización y ejecución de integraciones generales | Construir/adaptar lógica específica de cada correo; medir cómputo; verificar permisos compartidos |
| Unipile | API de correo y autorización alojada | Adaptar backend y probar hilos/duplicados; mayor coste por cuenta |
| EmailEngine | Control del despliegue y cuota fija | Redis/servidor, cifrado, actualizaciones, copias, recuperación y monitorización pasan a nuestra operación |
| Gmail + Graph directos | Control de permisos y protocolos | Dos integraciones, credenciales, renovación y recuperación de eventos; IMAP sería un tercer trabajo |

Gmail exige renovar sus watches, y Microsoft tiene suscripciones y eventos de ciclo de vida que hay que atender. [G2, M1] Una API unificada reduce diferencias, pero Cuebooker sigue necesitando deduplicación, revisión humana y control de errores. No hay mediciones comparativas que permitan afirmar que un proveedor sea más rápido o fiable que otro para nosotros.

Mi orden de esfuerzo, basado en el código revisado, es: mantener Nylas < migrar a otra API de correo unificada < usar una plataforma genérica de integración < construir sincronización directa o explotar nuestro propio servicio. No asigno fechas cerradas sin una prueba de autorización y respuesta en hilo. Cambiar OAuth puede requerir que los usuarios vuelvan a autorizar; no se deben prometer grants o IDs portables.

La amplitud multicanal de Unipile no demuestra que WhatsApp o Instagram personales puedan integrarse bajo las condiciones deseadas. Cada canal necesita estudiar API autorizada, permisos, continuidad y condiciones por separado. No usar esa promesa para justificar ahora un coste de correo.

## Datos y confianza

Nylas ofrece US y Europe; su centro europeo documentado está en Londres. «Europe» no equivale a «dentro de la UE». Nuestra prueba existente está en US; una nueva aplicación con otra región exige configuración y posiblemente nueva autorización. [N4]

Aurinko publica cifrado y una hoja de ruta SOC 2 Type I dirigida al tercer trimestre de 2026; el documento consultado no prueba que la auditoría haya terminado. No comparar certificaciones prometidas con informes ya emitidos. Su localización, DPA, subencargados, retención y borrado deben confirmarse antes de tratar correo real. [A4]

Alojar EmailEngine permite elegir infraestructura, pero traslada la responsabilidad operativa y no elimina las políticas OAuth. La evaluación debe incluir dónde se almacenan los datos y las copias, quién puede acceder, qué ocurre al revocar y cómo se borra. Elegir región no garantiza por sí solo cumplimiento de protección de datos.

Separar proveedor de buzón de proveedor de IA: cambiar Nylas no cambia Groq. La clasificación de correos debe mantenerse como función solicitada por el usuario, con información clara y sin usar esos correos para entrenar modelos generales. Google contempla usos de productividad, con restricciones de acceso y tratamiento; esto no es una aprobación de nuestro despliegue. [G3] Groq permite activar Zero Data Retention; su documentación también describe excepciones de retención por fiabilidad/abuso. Deben comprobarse controles efectivos de la cuenta, no inferirse del código. [AI1]

## Qué haría ahora, con criterio

1. Mantener la integración Nylas actual y la conexión pública de buzones pendiente. Acabar las comprobaciones de publicación del resto del producto sin prometer correo conectado disponible.
2. Obtener el precio total y condiciones de la vía de Gmail Nylas: Essentials con OAuth propio o Shared App, plan, Accelerator, duración, scopes, región y responsabilidades. No aceptar un año de servicio sin esa información.
3. Si existe una vía mensual razonable y cumple Gmail/Outlook, lanzar un piloto de pocos usuarios con presupuesto y plazas limitadas. Si exige anual caro, probar Unipile en un entorno aislado con mensajes ficticios y usuarios de prueba expresamente autorizados; comparar el resultado con Nango si sus permisos compartidos quedan confirmados.
4. No migrar a Aurinko solo por tarifa: exige resolver OAuth propio y a 10 cuentas no ahorra en correo. Reabrirlo cuando exista demanda, permisos propios y ahorro suficiente para compensar el cambio.
5. Revisar la economía al llegar a 25 y 100 buzones facturables o si el coste de autorización altera el presupuesto. Estos son puntos de revisión, no umbrales automáticos de migración.
6. Si no hay presupuesto mensual, conservar pruebas de desarrollo y la vía del formulario/correo de plataforma, explicando la disponibilidad real. No disfrazar reenviar manualmente de automatización del buzón.

La razón para pagar un intermediario es reducir trabajo de sincronización y autorización que distrae del producto. La razón para cambiarlo debe ser un ahorro total o una capacidad demostrada, no el temor al coste aislado de 15 USD ni el trabajo ya invertido.

## Prueba mínima antes de adoptar cualquier alternativa

Usar mensajes ficticios; no trasladar buzones privados durante la investigación. Comprobar Gmail externo y Microsoft personal/corporativo, consentimiento y revocación, IMAP solo si forma parte del servicio prometido, respuesta que aparezca en enviados y en el hilo correcto, duplicados y reintentos, eventos atrasados, paginación, reconexión, aislamiento entre agencias, coste de grants huérfanos y borrado. Para IA: ofertas, newsletters, facturas, ambigüedad e instrucciones maliciosas; medir falsos positivos y falsos negativos. Definir criterios de aceptación antes del piloto, sin inventar una tasa de precisión.

## Fuentes primarias y límites

Consultadas el 04-10-2026. Fuentes comerciales son declaraciones del proveedor, no auditorías independientes. No se solicitó presupuesto ni se contactó a ventas. La documentación contradictoria o incompleta figura como pendiente.

- [N1] https://www.nylas.com/pricing/
- [N2] https://developer.nylas.com/docs/provider-guides/google/shared-gcp-app/
- [N3] https://developer.nylas.com/docs/support/billing/
- [N4] https://developer.nylas.com/docs/dev-guide/platform/data-residency/
- [A1] https://docs.aurinko.io/faq/how-does-aurinko-billing-work
- [A2] https://docs.aurinko.io/faq/does-aurinko-provide-a-shared-verified-google-oauth-application
- [A3] https://docs.aurinko.io/unified-apis/email-api
- [A4] https://www.aurinko.io/certifications/
- [E1] https://postalsys.com/plans
- [NG1] https://nango.dev/pricing
- [NG2] https://nango.dev/docs/guides/auth/auth-guide
- [U1] https://www.unipile.com/pricing-api/
- [U2] https://developer.unipile.com/docs/google-oauth
- [U3] https://developer.unipile.com/v2.0/docs/billing
- [G1] https://developers.google.com/workspace/gmail/api/auth/scopes
- [G2] https://developers.google.com/workspace/gmail/api/guides/push
- [G3] https://developers.google.com/workspace/workspace-api-user-data-developer-policy?hl=en
- [M1] https://learn.microsoft.com/en-us/graph/change-notifications-lifecycle-events
- [AI1] https://console.groq.com/docs/your-data
