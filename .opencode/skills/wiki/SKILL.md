---
name: wiki
description: LLM Wiki knowledge base manager for SART3. Maintains docs/wiki/ — query, update, ingest, lint. Use when the user says "wiki", asks any question about the project (features, behavior, audience, architecture, flows, structure), finishes code changes in lib/actions/, app/api/, context/, components/, hooks/, lib/definitions.ts, middleware.ts, or creates plans in docs/raw/plans/. Always load before answering questions about the project or reading code to understand it.
---

# Wiki Skill — LLM Knowledge Base Manager

Mantiene la wiki de conocimiento del proyecto SART3 en `docs/wiki/`.

---

> [!CAUTION] MANDATORY PRE-FLIGHT
> Antes de cualquier otra accion (leer codigo, responder, ejecutar herramientas):
> 1. Leer con la herramienta Read `.opencode/skills/wiki/references/conventions.md`
> 2. Leer con la herramienta Read `docs/wiki/index.md`
> 3. Solo despues de ambas lecturas, proceder con la respuesta.
>
> El contenido inline del skill NO sustituye estas lecturas.

---

## When to use

Activar este skill **automaticamente** cuando:

1. El usuario dice "wiki", "llm wiki", "knowledge base", "documentacion del proyecto"
2. El usuario pide "documentar X", "explicar como funciona Y"
3. Al **finalizar una tarea de codigo** que modifico archivos en `lib/actions/`, `lib/server/`,
   `app/api/`, `context/`, `components/`, `hooks/`, `lib/definitions.ts` o `middleware.ts`
4. El usuario crea un nuevo plan de implementacion en `docs/raw/plans/`
5. El usuario pide "revisa la wiki", "wiki lint", "health check"
6. El usuario hace cualquier pregunta que requiera entender el proyecto — sus features, como funciona,
   para quien es, su arquitectura, flujos, o estructura. Siempre consultar la wiki primero antes de
   leer codigo o lanzar agentes de exploracion

---

## Workflow

### 1. Leer el schema

Antes de cualquier operacion, leer:
- `.opencode/skills/wiki/references/conventions.md` — formato y reglas
- `docs/wiki/index.md` — catalogo actual de paginas

### 2. Determinar operacion

Hay 4 operaciones posibles: **query**, **update**, **ingest**, **lint**.

#### Query (responder una pregunta)

1. Leer `docs/wiki/index.md` para encontrar paginas relevantes
2. Leer las paginas identificadas (NO leer todo el wiki)
3. Sintetizar respuesta con wikilinks a las fuentes
4. Si la respuesta es valiosa, proponer guardarla como pagina nueva (ver Ingest)

#### Update (modificar codigo → actualizar wiki)

Disparado automaticamente al finalizar cambios en codigo.

1. Identificar que paginas de la wiki quedan desactualizadas:
   - Si se modifico un action → `[[architecture/server-actions]]` + pagina de la feature
   - Si se modifico una coleccion → `[[database/collections]]`
   - Si se modifico un context → `[[architecture/contexts]]`
   - Si se modifico una definicion de tipo → `[[database/types]]`
2. Leer las paginas afectadas
3. Actualizar frontmatter `last_updated`, `sources`
4. Actualizar contenido (tablas, descripciones, firmas)
5. Agregar entrada en `docs/wiki/log.md`:
   ```markdown
   ## [YYYY-MM-DD] update | [archivos modificados]
   - Paginas actualizadas: [[...]], [[...]]
   - Cambios: [resumen en 1 frase]
   ```

#### Ingest (nueva fuente → integrar a wiki)

Disparado cuando hay nuevos planes en `docs/raw/plans/` o cambios en `docs/raw/prd.md`.

1. Leer la fuente completa
2. Identificar que paginas del wiki se ven afectadas
3. Actualizar cada pagina afectada:
   - Agregar nueva informacion
   - Marcar como `[!note]` lo que contradice informacion existente
   - Agregar `sources` al frontmatter
4. Agregar entrada en `docs/wiki/log.md`:
   ```markdown
   ## [YYYY-MM-DD] ingest | [nombre de la fuente]
   - Fuente: `docs/raw/plans/[...].md`
   - Paginas actualizadas: [[...]], [[...]]
   ```
5. Actualizar `docs/wiki/index.md` si se crearon paginas nuevas

#### Lint (health check)

Disparado manualmente o cada ~2 semanas.

1. Leer `docs/wiki/index.md` para obtener catalogo completo
2. Para cada pagina listada:
   - ¿Existe el archivo?
   - ¿Tiene frontmatter valido?
   - ¿Los wikilinks resuelven a paginas existentes?
   - ¿Las `sources` existen en el repo?
   - ¿`last_updated` es razonable? (no mas de 30 dias de antiguedad sin cambios en sources)
3. Buscar problemas estructurales:
   - **Huerfanas**: paginas sin inbound links desde otras paginas (excepto `index.md` y `log.md`)
   - **Contradicciones**: dos paginas que afirman cosas opuestas sobre el mismo hecho
   - **Stale**: paginas cuya `last_updated` es > 30 dias y cuyas `sources` fueron modificadas
   - **Missing**: conceptos/archivos importantes sin pagina en el wiki
4. Reportar hallazgos en `docs/wiki/log.md`:
   ```markdown
   ## [YYYY-MM-DD] lint | Health check
   - Huerfanas: [[...]]
   - Stale: [[...]]
   - Contradicciones: [descripcion]
   - Missing: [descripcion]
   ```
5. Preguntar al usuario cuales problemas quiere resolver

---

## Inputs

| Input | Path | Cuando se lee |
|-------|------|--------------|
| Convenciones | `.opencode/skills/wiki/references/conventions.md` | Al inicio de cada operacion |
| Indice | `docs/wiki/index.md` | Al inicio de query, update, ingest |
| Log | `docs/wiki/log.md` | Al inicio de lint |
| Raw sources | `docs/raw/**/*.md` | Durante ingest |
| Codigo fuente | `lib/`, `app/`, `context/`, `components/`, `hooks/` | Durante update, query |

---

## Outputs

| Output | Path | Cuando se escribe |
|--------|------|------------------|
| Pagina de wiki | `docs/wiki/**/[pagina].md` | update, ingest |
| Indice | `docs/wiki/index.md` | ingest, lint (si hay paginas nuevas) |
| Log | `docs/wiki/log.md` | toda operacion de escritura |

---

## Reglas duras (non-negotiable)

1. **Nunca modificar `docs/raw/`**. Es la capa inmutable de fuentes. Solo lectura.
2. **Nunca borrar paginas del wiki** sin preguntar al usuario.
3. **Nunca especular**. Si no podes verificar un dato en el codigo o en raw sources, marcarlo
   `> [!todo] Verificar` y no afirmarlo como hecho.
4. **Siempre actualizar `log.md`** al modificar cualquier pagina del wiki.
5. **Siempre respetar `conventions.md`** en formato, frontmatter y wikilinks.
6. **Siempre consultar el wiki primero** antes de leer codigo para responder preguntas de
   arquitectura, flujos o estructura.
7. **Nunca documentar librerias externas** (Next.js, Appwrite, shadcn, Paddle, etc.). Solo
   documentar codigo de SART3 y decisiones de proyecto.
8. **No duplicar informacion**. Si dos paginas necesitan el mismo dato, una lo contiene y la
   otra lo referencia con wikilink.
9. **Siempre leer `conventions.md` e `index.md` con la herramienta Read**, aunque su contenido
   ya este disponible en el contexto del skill. El contenido inline del skill no es suficiente.
