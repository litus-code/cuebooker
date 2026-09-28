# CUE ID · pipeline de assets modulares

Estado: arquitectura de incorporación preparada; **cero piezas admitidas**. Esta capa no alimenta el selector ni la escena actual. El runtime de producción mantiene su manifest y su GLB únicos hasta que un primer asset y el montaje modular superen revisión visual y de rendimiento. No se crean opciones ficticias ni se cambian IDs persistidos existentes.

## Contrato y fuentes

- Body y armature propios: `cue_rig`. Los GLB del laboratorio en `public/cue-id/lab/bodies/` son referencia de trabajo, no un `CUE_ID_MASTER.blend` aprobado. Los bodies male/female y su segmentación siguen pendientes de validación conjunta. No se afirma que el runtime actual pueda ocultar regiones.
- Un ID semántico estable por pieza; el archivo exportado lleva `_vN` y el registry `app/domain/cueIdModularAssets.ts` decide la versión. Los datos persistibles son IDs; nunca se persisten meshes, nodos ni offsets de escena.
- Directorios reservados: `public/cue-id/bodies/{male,female}`, `hair`, `tops`, `bottoms`, `shoes`, `accessories`, `thumbnails`. No mover aquí los GLB de laboratorio sin aprobación.
- Assets rígidos se anclan por bone nombrado y offset normalizado; deformables tienen skin y `cue_rig`, más las regiones del body que deberán ocultarse. `supportedTiers` enumera `full`/`reduced`; `static` exige una imagen de avatar compuesta y una admisión posterior, no un GLB cargado en el cliente.
- `incompatibleWith` expresa combinaciones prohibidas por ID. Ninguna pieza se activa por el mero registro: la admisión en producción es un gate separado.

## Preparar el master en Blender

1. Crear `CUE_ID_MASTER.blend` a partir del body y rig **revisados**, con escala, orientación, pose base y origen fijados; colecciones `REFERENCE` y `EXPORT`, cámara y luces solo en `REFERENCE`. Guardarlo como fuente de arte versionada cuando exista y comprobar licencias de fuentes externas. Trabajar por copia para cada pieza.
2. Importar FBX/GLB externo. Eliminar cámara, luces, helpers y rigs ajenos; aplicar Rotation & Scale. Ajustar hombros, cadera, mangas y holgura sobre ambos bodies compatibles.
3. Ropa deformable: Data Transfer desde el body correspondiente, Vertex Groups / Nearest Face Interpolated; normalizar, limpiar y limitar weights, Armature modifier al **mismo** `cue_rig`. Si ambos bodies difieren, exportar y validar variantes separadas antes de declararlos compatibles. Marcar regiones cubiertas solo si sus meshes/materiales pueden ocultarse de forma comprobada.
4. Pelo y accesorios rígidos: malla ligera, sin hair particles ni simulación; registrar bone real (`Head`, etc.) y offsets después de verificar el nombre en el rig aprobado. Evitar arreglos improvisados de posición en ThreeJS.
5. Revisar frente, espalda y laterales; neutral, brazos arriba/adelante, torsión, pierna a 90° y sentadilla ligera. Corregir clipping y weights en Blender.
6. Material PBR simple, preferentemente 1 y como máximo 2; texturas web 512–1024 px según tamaño visible. Referencias orientativas: hair 10–30k tris, top/bottom 5–20k, shoes 5–15k, accesorio 1–10k; GLB comprimido objetivo 1–5 MB. Registrar cualquier excepción justificada.
7. Exportar GLB con malla, materiales, texturas y, si es deformable, skeleton; sin cámara, luces ni helpers. Crear `thumbnails/<id>.webp` de la pieza. Mantener original y copia Blender fuera del directorio público.

## Registro y validación

Ejemplo **de forma**, no pieza admitida:

```ts
cueIdModularAssets.top_tee_oversized_01 = {
  id: 'top_tee_oversized_01', category: 'top', label: 'Oversized tee',
  src: '/cue-id/tops/top_tee_oversized_01_v1.glb',
  thumbnail: '/cue-id/thumbnails/top_tee_oversized_01.webp',
  version: 1, bodyVariants: ['male'], supportedTiers: ['full'],
  mount: { kind: 'skinned', rig: 'cue_rig', hideBodyRegions: ['torso_upper'] }
}
```

Ejecutar `npm run cue-id:validate-modular`. Comprueba IDs, rutas, campos, referencias, cabeceras GLB/WebP, skeleton declarado en deformables y ausencia de cámaras/luces. **No demuestra** que weights, bone names, compresión, offsets, clipping o rendimiento sean correctos. El preview del selector futuro leerá únicamente entradas admitidas; no añadir `if (top === ...)` en componentes.

## Gate de cada pieza

- [ ] Progreso documentado: `raw → fitted → rigged → optimized → approved`; `production` solo tras decisión independiente. Fuente y derechos claros.
- [ ] Scale/origen/pose/rig coinciden con master aprobado. Malla y materiales optimizados, GLB + thumbnail válidos, registry y validador pasan.
- [ ] Body bajo ropa segmentado y comprobado, sin clipping grave. Poses y cuatro vistas revisadas en cada body declarado.
- [ ] Probar cada top con cada bottom, pelo con gorra/auriculares, zapatos con bottoms pertinentes; declarar incompatibilidades reales.
- [ ] Desktop, Android e iPhone: carga, cambio repetido sin fuga de memoria, FPS y fallback `full/reduced/static`. No renderizar un canvas por miniatura.

## Integración posterior, cuando exista la primera pieza aprobada

1. Admitir un body segmentado y un bone map real; asegurar que las regiones ocultables no eliminan partes visibles de otras prendas.
2. Añadir un adaptador del registry al creator semántico actual, con migración explícita de IDs legacy si cambian opciones. No cambiar el schema persistido a ciegas.
3. Loader con caché por URL/version y clones independientes para skinning; montajes rígidos al bone real, prenda skinned con skeleton compartido. Cancelar solicitudes obsoletas y liberar recursos solo cuando ninguna instancia los usa.
4. Mantener selección/fallback actual por tier y la admisión del `cueIdProductionManifest`; probar cambio de pieza sin descargar de nuevo el body, y restaurar la escena anterior si falla el asset.
5. Publicar únicamente tras revisión de combinación, rendimiento, licencia y preview. Producción queda fuera de este bloque.
