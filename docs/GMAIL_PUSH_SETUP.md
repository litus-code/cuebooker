# Configurar Gmail push por entorno

4 de octubre de 2026. Automatiza los recursos Google que se configuraron manualmente en staging. No despliega Cuebooker ni activa usuarios. Ejecutar desde el repositorio en Cloud Shell o un equipo con Python 3 y Google Cloud CLI autenticado en `cuebooker`, el proyecto del cliente OAuth.

## Primero revisar, después aplicar

Producción, plan local sin llamadas remotas:

```bash
python3 scripts/configure-gmail-push.py --project cuebooker --environment production --supabase-ref qlocooqfdzehogbwcbhr
```

Cuando corresponda configurar producción, el mismo comando con `--apply` crea los recursos que falten y comprueba la suscripción:

```bash
python3 scripts/configure-gmail-push.py --project cuebooker --environment production --supabase-ref qlocooqfdzehogbwcbhr --apply
```

Para staging: `--environment staging --supabase-ref lycprjeuuynfzwskycwv`. No ejecutar producción como parte de una prueba de staging. El script rechaza cruces de entorno y no cambia el proyecto predeterminado de gcloud.

| Entorno | Topic | Suscripción | Cuenta OIDC |
| --- | --- | --- | --- |
| staging | cuebooker-gmail-staging | cuebooker-gmail-staging-push | cuebooker-gmail-push-staging |
| production | cuebooker-gmail-prod | cuebooker-gmail-prod-push | cuebooker-gmail-push-prod |

El sufijo `prod` evita exceder el límite del ID de la cuenta de servicio. Todos los recursos pertenecen al proyecto `cuebooker`. La URL y audience apuntan a `https://REF.supabase.co/functions/v1/gmail-mailbox-events` del entorno seleccionado.

El operador necesita permiso para consultar/crear los recursos, habilitar APIs y modificar sus políticas IAM, además de `iam.serviceAccounts.actAs` sobre la cuenta que firma push. No asignar Owner, Editor ni un rol de agente de servicio a un usuario para resolver un error. El script no modifica los permisos del operador.

Las consultas iniciales necesitan Pub/Sub e IAM habilitados; este proyecto ya los tiene. Si una API está deshabilitada, el script se detiene. Revisar ese error y habilitar privadamente la API indicada antes de repetir. Sólo `NOT_FOUND` permite crear recursos faltantes; errores de permisos o autenticación abortan. No hay rollback automático: una ejecución interrumpida puede dejar recursos parciales y se puede repetir tras corregir la causa.

Añade Gmail Publisher únicamente al topic y Token Creator únicamente sobre la cuenta OIDC dedicada para el service agent Pub/Sub del proyecto. No crea claves privadas, borra recursos ni elimina políticas existentes. Una suscripción con otro topic, destino exportado, filtro o transformación aborta antes de mutaciones. Una suscripción compatible existente conserva su identidad, recibe endpoint/OIDC/audience completos y vuelve al envoltorio JSON; se verifica al terminar. La repetición no duplica recursos.

## Lo que queda fuera del comando

El script imprime tres valores no secretos para Edge. No obtiene ni guarda credenciales OAuth, tokens o secretos. Configurar el cliente OAuth independiente, callback exacto, cuentas de prueba y marca/política de privacidad sigue siendo una tarea aparte. Revisar los permisos y requisitos de Google antes de invitar usuarios.

Antes de activar producción: rehearsal aislado del manifiesto vigente de 39 archivos SQL, backend y configuración del mismo candidato revisado, secretos privados, URLs Vault de ambos workers y cron comprobados. Mantener el gate de análisis apagado hasta completar esa preparación. Después, consentimiento explícito de una cuenta de prueba y repetir el recorrido de aceptación de staging. No reutilizar tokens ni copiar credenciales cifradas entre entornos.

Pruebas locales: `python3 -m unittest discover -s tests -p test_gmail_push_setup.py`. Cubren cruces de entorno, conflicto antes de mutaciones, creación frente a actualización, IAM acotado, errores de permisos y verificación final. Son mocks, no prueban ejecución autenticada en Google. El plan de producción se ejecutó localmente; `--apply` no se ha ejecutado en ningún entorno. El 17 de octubre el propietario ejecutó los comandos equivalentes en Cloud Shell para producción: creó topic, cuenta OIDC y suscripción, y compartió salida IAM y configuración final coincidente. El primer intento falló por `--condition=None` en el comando estable de Pub/Sub; se retiró esa opción sólo de Pub/Sub y el segundo bloque terminó correctamente. El script y la regresión reflejan la corrección. Esta evidencia no prueba OAuth, recepción real ni despliegue del backend.

Referencias oficiales consultadas:

- https://docs.cloud.google.com/sdk/gcloud/reference/pubsub/subscriptions/create
- https://docs.cloud.google.com/sdk/gcloud/reference/pubsub/subscriptions/update
- https://docs.cloud.google.com/sdk/gcloud/reference/beta/services/identity/create
- https://docs.cloud.google.com/pubsub/docs/authenticate-push-subscriptions
