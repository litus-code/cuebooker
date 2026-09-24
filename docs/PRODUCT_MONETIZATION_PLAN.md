# Cuebooker: plan de monetización y producto

Estado: decisión de trabajo para V1  
Entorno de validación: staging  
Producción: no modificar hasta aprobar la revisión final

## 1. Hipótesis de negocio

Cuebooker cobra cuando la actividad del artista crece y el trabajo operativo empieza a consumir tiempo. El plan gratuito debe permitir completar el circuito real:

`REQUEST → CONVERSATION → HOLD → DECISION → BOOKING → EVENT → CUE PASSPORT`

Las solicitudes nunca se bloquean. El límite gratuito se aplica al confirmar actividad, no al recibir oportunidades.

## 2. Planes

### Free

Precio: 0 €.

Incluye:

- Solicitudes y conversaciones sin límite.
- Hasta 3 bookings confirmados por mes.
- Holds y decisiones.
- Perfil público o privado.
- Formulario, enlace, QR e iframe.
- Calendario básico.
- CUE Passport básico.
- CUE ID básico cuando esté disponible.

Al alcanzar el cuarto booking confirmado del mes, Cuebooker presenta Artist Pro. La solicitud permanece accesible y conserva su información.

### Artist Pro

Precio estándar: 9,99 €/mes o 99 €/año.

Incluye en V1 de pago:

- Bookings confirmados sin límite.
- Historial completo.
- Smart Capture ampliado.
- Automatizaciones operativas.
- Mayor capacidad para adjuntos.
- Personalización ampliada del perfil.

Funciones que deben aparecer como «Próximamente» hasta estar operativas:

- Sincronización con calendarios externos.
- Passport avanzado y media de eventos.
- Analytics.
- Exportaciones avanzadas.

### Founding Artist

Disponible para los primeros 100 artistas.

Precio: 7,99 €/mes o 79 €/año.

El artista conserva el precio mientras mantenga activa la suscripción. La oferta pertenece a Artist Pro y debe mostrarse dentro de su tarjeta, no como una nota independiente.

### Agency

Precio objetivo inicial: 39 €/mes o 390 €/año.

Estado: próximamente.

Alcance previsto:

- Workspace multiartista.
- Hasta 10 artistas en la primera propuesta comercial.
- Equipo, roles y permisos.
- Asignación de solicitudes.
- Inbox compartido.
- Calendario de roster.
- Reporting de agencia.

El precio por artistas adicionales se decidirá después de validar el uso con managers.

## 3. Calendario

### Básico

- Vista mensual.
- Bookings y holds creados en Cuebooker.
- Detección de solapes.
- Acceso desde una fecha a su solicitud.

### Pro previsto

- Sincronización con Google Calendar, Apple Calendar y Outlook.
- Reglas recurrentes de disponibilidad.
- Bloqueos y excepciones.
- Recordatorios y caducidad automática de holds.
- Exportación.

### Agency previsto

- Vista conjunta del roster.
- Filtros por artista.
- Disponibilidad cruzada.
- Gestión de holds del equipo.

## 4. Estados comerciales de las funciones

Cada función debe tener uno de estos estados visibles:

- Disponible: funciona en staging y está preparada para clientes.
- Beta: funciona, pero todavía requiere validación.
- Próximamente: está definida y planificada, pero no debe venderse como disponible.

No se utilizarán etiquetas genéricas como «avanzado» sin enumerar qué obtiene el cliente.

## 5. Prioridad de construcción

1. Auditar el estado real de las funciones anunciadas.
2. Definir entitlements y límites por plan.
3. Implementar el contador mensual de bookings confirmados.
4. Preparar los estados de upgrade sin bloquear solicitudes.
5. Cerrar Artist Pro V1.
6. Integrar Stripe y los ciclos mensual/anual.
7. Instrumentar eventos de producto.
8. Abrir Founding Artist.
9. Validar Agency con managers antes de completar su desarrollo.

## 6. Experimento comercial de 90 días

Objetivos mínimos:

- 30 solicitudes reales.
- 5 clientes de pago.
- Uso repetido después del primer booking.
- Conversión medible al alcanzar el límite Free o usar una función Pro.

Eventos a medir:

- Perfil publicado.
- Formulario compartido.
- Primera solicitud recibida.
- Primera conversación.
- Primer hold.
- Primer booking confirmado.
- Segundo y tercer booking del mes.
- Límite Free alcanzado.
- Pantalla de upgrade vista.
- Suscripción iniciada.
- Suscripción cancelada.

## 7. Fuera de alcance inmediato

- Marketplace masivo.
- Discovery público por disponibilidad.
- Contratos y facturación.
- Pagos a artistas.
- Integración automática completa de mensajes de Instagram.
- Integración completa con WhatsApp Business.
- Matching avanzado.
- CUE ID 3D como motivo principal de pago.

Estas líneas se retomarán cuando Booking Core demuestre uso repetido y disposición de pago.
