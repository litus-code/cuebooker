# Beta privada con correo real
Actualización aceptada el 4 de octubre: desarrollar Gmail directo en modo Testing para una cohorte de prueba admitida manualmente. Tarea 1 implementa solicitud/aprobación; Tarea 2 implementará OAuth, hilos, caducidad y eventos; Tarea 3 revisará el filtro anterior a la IA. Esta dirección sustituye la prioridad anterior de evaluar Unipile. Testing tiene un límite de usuarios y autorización de siete días; no es una exención permanente para operar un producto comercial. Ver `MAILBOX_BETA_ACCESS.md` para despliegue, operación y pendientes. La implementación de Gmail de la Tarea 2 ya está preparada y desplegada en staging, con cron Gmail pausado y pendiente de configuración privada GCP y prueba real. Ver `GMAIL_PRIVATE_BETA.md`. No se ha contratado ningún proveedor.

Fecha: 4 de octubre de 2026. Decisión del propietario: preparar una beta privada que permita probar el valor completo de Cuebooker.

## Alcance aceptado
Mantener los perfiles DJ y agencia, los cambios aprobados y sus onboardings. La prueba debe permitir conectar el buzón, detectar una oferta con consentimiento, revisar sus datos, crear una única solicitud, responder desde el buzón original, incorporar la respuesta al mismo hilo y reflejar una fecha confirmada en el calendario. La IA no confirma fechas ni envía respuestas por iniciativa propia.

## Estado verificado
La integración Nylas existe en staging. Hay evidencia histórica de conexión Google, importación, envío técnico aceptado, sincronización manual de hilo, extracción revisada y detección entrante con consentimiento. Falta una comprobación reciente del recorrido completo, especialmente entrega/respuesta enlazada en segundo plano, DJ independiente y móvil. No partir de cero ni presentar pruebas parciales como aceptación completa.

## Ruta de proveedor
El 4 de octubre se inspeccionaron los planes de la cuenta Nylas autenticada, sin contratar: Pro anual 516 USD/año y Accelerator 2400 USD/año como complemento opcional. Accelerator incluye la aplicación Google compartida; total base de esa ruta: 2916 USD/año, antes de impuestos y extras. El plan Essentials de 15 USD/mes no incluye esa capacidad. No comprar esta ruta para el arranque sin una decisión nueva sobre ese importe.

Conservar Nylas y sus conexiones actuales para las comprobaciones técnicas autorizadas. Sandbox admite cinco grants para desarrollo/pruebas; no inferir permiso de beta externa o producción por ese límite.

Primera alternativa a comprobar: Unipile publica 49 EUR/mes hasta diez cuentas y prueba de siete días sin tarjeta. Publica uso de una aplicación Google certificada para usuarios reales, pero debemos confirmar disponibilidad en la cuenta, scopes de lectura/envío, recepción de eventos, restricciones y condiciones del piloto. Su artículo comercial clasifica algunos scopes Gmail de forma incompatible con la documentación oficial Google; no reutilizar sus afirmaciones de exención ni costes CASA como hechos. La tarifa publicada no demuestra que nuestro caso esté incluido. No crear cuenta, aceptar contrato, transferir correo ni migrar grants sin autorización específica. No cambiar automáticamente de procesador.

## Orden operativo
1. Verificar el flujo existente con mensajes ficticios y buzones propios ya autorizados. Preparar contenido y destinatarios de cada envío antes de solicitar aprobación si falta.
2. Resolver acceso de usuarios externos con tarifa y condiciones comprobadas. Para Unipile: confirmar aplicación compartida en producción, lectura/envío/hilos/webhooks, cuota incluida y ausencia de compromiso anual. Si exige contacto con soporte, preparar la consulta y pedir autorización para enviarla.
3. Sólo después de confirmar la ruta, implementar un adaptador aislado si procede. Reutilizar Booking Core, consentimiento, límites y permisos. No modificar todo el producto ni invalidar la conexión Nylas actual.
4. Verificar DJ y agencia a 390 px y escritorio, consentimiento/revocación, duplicados, límites, fallo de proveedor, entrega y respuesta al mismo hilo.
5. Promover el mismo candidato Beta 0.0.2 a staging estable y producción tras completar el despliegue de backend y sus verificaciones existentes.
6. Invitar a una primera cohorte pequeña sólo cuando correo y conversación funcionen. La beta externa usa un entorno y términos permitidos por el proveedor, nunca Sandbox presentado como producción.

## Criterio de listo
Cada prueba registra entorno, SHA/versiones Edge, resultado y evidencia sin correos privados ni credenciales. Se exige una solicitud única tras reintento, remitente original y respuesta enlazada, revisión humana de artista/fecha/oferta, calendario coherente, retirada de acceso y separación de usuarios/workspaces. Una página de preview no sustituye el recorrido.

## Pendientes que requieren decisión o intervención externa
Precio y alcance final del proveedor alternativo; consentimiento del nuevo procesador; cuenta/condiciones y credenciales privadas; contenido/destinatarios de nuevos envíos si no están autorizados. No se ha autorizado gasto recurrente. El usuario ha aprobado la dirección de beta privada, no una migración concreta ni el abandono del perfil individual.

Fuentes: https://support.nylas.com/hc/en-us/articles/28841692494877-Nylas-Sandbox-vs-Production-Applications-Understanding-Limitations ; https://developer.nylas.com/docs/provider-guides/google/shared-gcp-app/ ; planes de cuenta Nylas observados en https://dashboard.nylas.com/organization/settings/billing/plans ; https://www.unipile.com/pricing-api/ ; https://www.unipile.com/integrating-google-oauth-2-0-user-authentication-into-your-app/ ; https://developers.google.com/workspace/gmail/api/auth/scopes

## Tarea 3, implementación del 4 de octubre

El worker sincroniza hilos conocidos antes del filtro. Respuestas automáticas y listas con metadatos combinados quedan en revisión; informes MIME de entrega quedan como otros. No se rechaza por remitente genérico, texto corto ni ausencia de palabras de booking. Los formularios auto-generated mantienen el análisis normal y el análisis manual sigue disponible.

Si Gmail cambia el threadId, se comprueban In-Reply-To/References mediante búsquedas exactas y metadatos RFC. Sólo se enlaza una solicitud si existe un mensaje guardado de la misma conexión/workspace y coincide el interlocutor. Las referencias ambiguas, desconocidas, inválidas o demasiado largas quedan para revisión. No se añaden tablas ni permisos; el ingest existente guarda la relación con el hilo nuevo. Nylas conserva su comportamiento. 514 pruebas y comprobación Deno pasan. Publicación/despliegue y limitaciones vigentes se registran en HANDOFF.md.

La configuración privada Google y el recorrido real siguen pendientes. El navegador devuelve Site Unavailable en Google Cloud. La implementación de la Tarea 3 no equivale a aceptación completa de la beta en producción.
