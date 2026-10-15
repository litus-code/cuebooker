# CUEBOOKER · HOME 2.1
## Encargo de implementación para Codex
Fecha: 14 de octubre de 2026
Repositorio: `litus-code/cuebooker`
Tipo de entrega: rama nueva + pull request en borrador + preview visual, sin merge ni despliegue en producción.

### 0. Objetivo

Evolucionar la home comercial actual, respetando su identidad industrial, club y editorial. Se trata de una iteración visual de la implementación mostrada en las cuatro capturas adjuntas, no de reconstruir Cuebooker desde cero. Mejorar el impacto del hero, la representación del problema, el equilibrio de las dos rutas de usuario y la presentación del ecosistema. El visitante debe entender el producto y poder registrarse.

**Las imágenes de referencia son las capturas del estado actual, no diseños finales.** Los ejemplos ilustrativos del encargo no autorizan a anunciar integraciones inexistentes.

### 1. Instrucciones iniciales obligatorias

1. Leer `AGENTS.md`, `docs/HANDOFF.md`, `docs/AGENT_WORKFLOW.md`, `docs/AGENT_ARCHITECTURE.md`, `docs/ARCHITECTURE_REFERENCE.md` y el registro de decisiones aplicable.
2. Verificar la rama principal actual, su HEAD y la PR activa que pueda afectar a la home. Trabajar sobre la versión más reciente acordada y evitar sobrescribir cambios de otras ramas.
3. Inspeccionar `app/pages/index.vue`, `content/es/home.json`, `content/en/home.json`, los componentes, assets, estilos y navegación realmente usados.
4. Contrastar los textos comerciales con el estado de implementación. Respetar `Booking Core` y las restricciones descritas en el repositorio.
5. Leer la especificación de Home 2.0 adjunta solo como antecedente. **Este documento 2.1 prevalece cuando existe conflicto de diseño.**
6. Priorizar coherencia con el sistema visual existente antes que introducir un framework CSS, librerías de animación o nuevos recursos de pago.

### 2. Referencias incluidas

- `referencias/01-hero-actual.png`: hero, estética a conservar; rediseñar composición derecha.
- `referencias/02-problema-actual.png`: diagrama con flechas a reemplazar.
- `referencias/03-roles-actual.png`: paneles DJ y Manager/Agency a equilibrar.
- `referencias/04-ecosistema-actual.png`: tres columnas de texto a convertir en showcase editorial.

### 3. Dirección de arte global

Negro profundo, gris técnico, verde/amarillo ácido Cuebooker, rojo como acento secundario ocasional. Tipografía de titulares grande, fuerte y legible; contrastes AA; composición editorial y ritmo entre bloques. Evitar aspecto genérico de tarjetas SaaS, emojis como iconos, exceso de bordes, sombras arbitrarias y decoración gratuita. Mantener marca y logo existentes (no redibujarlos).

No generar imágenes de producto ficticias. Reutilizar fotografías y assets disponibles en el repo. Para Passport, CUE ID y perfil público, utilizar vistas reales si están disponibles; si falta algún asset, preparar composición CSS honesta y dejar constancia en PR.

### 4. BLOQUE 01: Hero cinematográfico

**Conservar**: fondo de club/warehouse actual si tiene calidad suficiente, logo, navegación ES/EN y dark/light, identidad ácido/negro, gran titular y barra inferior `Captura · Revisa · Haz seguimiento · Confirma`.

**Cambiar**:
- Composición única a pantalla ancha, evitando que el bloque derecho compita con el H1.
- H1 preferido ES: `TU BOOKING. / BAJO CONTROL.` con segunda línea en ácido. EN: `YOUR BOOKINGS. / UNDER CONTROL.`
- Subclaim ES: `Reúne solicitudes, conversaciones y fechas en un solo lugar. Aunque el contacto empiece fuera de Cuebooker.`
- CTA principal: `CREAR MI PERFIL` enlazado al flujo real de registro.
- CTA secundario: `VER CÓMO FUNCIONA` con scroll a demo/sección real y compensación de header.
- `Que la música siga avanzando. El booking ya está ocurriendo.` queda como firma editorial discreta, sin caja flotante dominante.
- Reducir/eliminar etiqueta `CUE / 001` y la `C/` enorme si dificultan la lectura. Se permite una marca de agua sutil.
- Dejar preparado un punto de entrada para reproducir el spot, **solo incluir vídeo cuando exista el asset final y derechos para uso comercial**. No incrustar vídeos externos inventados.
- Si no hay asset verificado, conservar fondo y no mostrar botón que no funcione.

Comportamiento: foco en CTA, título legible sobre cualquier zona de imagen, adaptación a 390px/768px/desktop, carga eficiente, sin CLS ni desplazamiento horizontal. Animación discreta respetando `prefers-reduced-motion`.

### 5. BLOQUE 02: El problema y Booking Core

**Eliminar el diagrama actual de chips flotantes + flechas convergentes.**

Nueva propuesta: una composición de dos ámbitos visuales en desktop:
- Izquierda: 4-6 entradas reconocibles (Instagram, WhatsApp, email, llamada, notas/calendario), cada una con microcontexto (`propuesta`, `cambio de fecha`, `condiciones`, etc.).
- Centro/transición: conector muy sobrio mediante CSS (sin telaraña de flechas); opcional microanimación de progresión visual.
- Derecha: vista tipo Booking Core usando la estética real del producto: `Solicitud`, `Contacto`, `Fecha`, `Estado`, `Siguiente acción`.

En mobile: distribución vertical, sin cruces visuales ni overflow.

**Regla semántica**: nunca sugerir que Instagram/WhatsApp/llamadas se importan automáticamente si no está probado. El relato debe ser: la conversación puede empezar en esos canales, el DJ captura/contextualiza una oportunidad en Cuebooker y conserva el seguimiento. El ejemplo es ilustrativo y se debe identificar como tal si simula datos. La captura por email/voz asistida solamente se anuncia si se verifica que está disponible en el entorno objetivo.

Textos recomendados ES:
- Eyebrow: `EL PROBLEMA`
- H2: `Tus bookings están por todas partes.`
- Descripción: `Una fecha cambia por WhatsApp. Las condiciones llegan por email. Cuebooker mantiene el seguimiento de la propuesta en un solo espacio.`
- Panel: `Una solicitud. Todo su contexto.`

Proporcionar equivalentes EN naturales.

### 6. BLOQUE 03: Dos rutas, mismo peso estructural

Cambiar las tarjetas actuales por **dos paneles de exactamente igual ancho y alto** en desktop, con misma alineación de textos/CTA y densidad visual equivalente. El panel DJ puede tener un borde/acento ligeramente más luminoso sin modificar sus dimensiones.

- DJ: `SOY DJ` / `Mis propuestas, conversaciones y fechas, en un solo lugar.` / CTA `CREAR MI PERFIL`.
- Agency: `SOY MANAGER / AGENCIA` / `Coordina el seguimiento de las oportunidades de tus artistas desde un mismo espacio.` / CTA `CREAR MI ESPACIO`.
- Un recorrido debe llevar al signup real conservando el tipo de perfil cuando la app lo permita; si no existe parámetro soportado, no inventarlo y describirlo en PR.
- Mantener aviso honesto cuando funciones de agencia sigan evolucionando.

En móvil: apilar paneles con idéntico padding, longitud visual comparable y buen tratamiento de textos.

### 7. BLOQUE 04: Ecosistema como showcase

Reemplazar la presentación actual de tres columnas planas.

Composición editorial:
- **Perfil público** como panel principal/ancho, con visual de una ficha real o preview válida; mensaje `Tu identidad. Tu entrada de bookings.` y aclaración de que el promotor no necesita cuenta.
- **CUE Passport** como panel secundario: visual de trayectoria real (captura real si existe, si no ilustración CSS identificada como concepto). `Cada fecha deja huella.`
- **CUE ID** como otro panel secundario con asset 3D real existente, si está disponible. `Una identidad propia.` Etiqueta inequívoca `EN DESARROLLO`.

Se debe notar que Perfil público está operativo y CUE ID es una función en desarrollo. Nunca usar resultados falsos de DJs, apariencias o cifras sin indicar que son ejemplos.

En desktop: principal a ancho completo, secundarios en dos columnas. En móvil: disposición vertical. Mantener jerarquía, proporciones y accesibilidad.

### 8. CTA final

Bloque de fuerte contraste usando el ácido de la marca:
- ES: `EL PRÓXIMO BOOKING YA ESTÁ EN CAMINO.`
- Subtexto: `Prepara tu espacio para recibir propuestas, organizarlas y seguirlas hasta la confirmación.`
- CTA real: `CREAR MI ESPACIO`.

Cuidado con el claim: no implica garantía de recibir una actuación. EN equivalente natural.

### 9. Contenido, arquitectura y alcance

- Mantener traducción ES/EN consistente, títulos SEO, metadatos y enlaces reales.
- `app/pages/index.vue` contiene mucho contenido inline; modularizar componentes si reduce complejidad sin afectar comportamiento. No hacer refactor masivo ajeno a home.
- Reutilizar tokens/CSS existentes y no duplicar lógica del estado de aplicación.
- Mantener funciones de `auth`, preferencias de idioma/tema, anclas, menú responsive, accesibilidad y tracking existente.
- No cambiar `Booking Core`, RLS, Supabase, ingesta por email, voz, precios, pago, workspace ni onboarding.
- No crear por ahora `/dj` ni `/agency` como nuevas páginas, tampoco instalar píxeles publicitarios. Eso pertenece a la PR de campaña posterior.
- No anunciar integraciones por el mero hecho de aparecer sus marcas en una ilustración.

### 10. Validación y aceptación

Comprobar:
- Build y tests existentes (documentar comandos, resultados y fallos previos).
- Desktop ≥1440, tablet ~768, móvil ~390 y ~320 px.
- Sin overflow, botones cortados, solapes ni espacio vacío injustificado.
- Cabecera sticky y anclas funcionales, teclado, foco, labels, contraste y reduced motion.
- CTA principal/roles llegan al flujo de registro; secundarios a un destino real.
- ES/EN sin mezcla accidental; modo claro y oscuro si ambos están soportados.
- Imágenes optimizadas, dimensiones estables, sin recursos de gran tamaño innecesarios.
- Test funcional mínimo de un flujo real de signup desde home sin modificar autenticación.
- Revisar que ninguna afirmación sobre IA, correo, voz, agency, Passport o CUE ID exceda capacidades comprobadas.

Adjuntar capturas de antes/después desktop y móvil en PR cuando el entorno lo permita. Evitar afirmar revisión visual si no se ejecutó.

### 11. Git, PR y entrega

- Crear rama aislada por ejemplo `feature/home-2-1-art-direction`, partiendo del HEAD correcto.
- Cambios limitados a home, assets relacionados y traducciones; documentación de handoff según normas del repo.
- Abrir **PR draft** con descripción, resumen visual, archivos modificados, pruebas, caveats y URL de preview verificada.
- **No fusionar, no desplegar a staging estable ni a producción** sin autorización expresa.
- Si surgen decisiones comerciales importantes o bloqueos de activos, describirlos en PR en lugar de improvisar una funcionalidad.

### 12. Mensaje que debe devolver Codex

1. Enlace de PR y rama.
2. Qué cambió por cada uno de los cuatro bloques y CTA final.
3. Qué se reutilizó del diseño actual.
4. Tests/build ejecutados y resultados.
5. Preview real y capturas si disponibles.
6. Limitaciones o materiales pendientes (especialmente spot).
