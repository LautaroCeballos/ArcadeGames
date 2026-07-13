# Wiki Conventions — SART3

Formato y reglas para cada pagina de `docs/wiki/`. Este documento es la referencia
tecnica del skill `wiki`. No contiene triggers ni workflows — eso esta en `SKILL.md`.

---

## Frontmatter requerido

Toda pagina (`*.md`) en `docs/wiki/` debe abrir con este bloque YAML:

```yaml
---
title: "Titulo descriptivo en espanol"
tags: [dominio, subtema]
last_updated: "YYYY-MM-DD"
sources:
  - path/relativo/al/archivo.ts      # una fuente
  - otro/archivo.ts:42               # con linea especifica
---
```

### Reglas del frontmatter

- **`title`**: Nombre descriptivo de la pagina. Coincide con el H1.
- **`tags`**: Array de strings en minusculas. Usar:
  - `architecture`, `database`, `feature`, `payment`, `concept`, `decision`, `gotcha`, `frontend`, `i18n`, `marketing`
  - Ademas del tag de dominio, incluir el dominio de feature especifico:
    - `auth`, `bookings`, `guests`, `payments`, `pricing`, `pdv`, `public-portal`, `bug-report`, `admin`,
      `mercadopago`, `paddle`
- **`last_updated`**: Fecha ISO. No inventar — debe ser la fecha real del dia en que se escribe/actualiza.
- **`sources`**: Array de paths relativos a la raiz del proyecto. Cada entrada es un archivo del codigo fuente
  que respalda la informacion de esta pagina. Omitir si la pagina es puramente sintesis (ej. `index.md`,
  `log.md`).

---

## Wikilinks

Usar wikilinks Obsidian `[[path]]` para TODA referencia cruzada entre paginas:

```markdown
Ver [[architecture/server-actions]] para el inventario completo.
```

### Reglas de wikilinks

- **Formato**: `[[directorio/pagina]]` **sin extension `.md`**.
- **Path relativo**: Desde la raiz de `docs/wiki/`. Ejemplo:
  - Desde `architecture/overview.md` a `database/collections.md` → `[[database/collections]]`
  - Desde `features/auth.md` a `architecture/gotchas.md` → `[[architecture/gotchas]]`
- **Nunca links absolutos**: No usar `https://...` ni paths de repo como `/lib/...`. Los wikilinks son
  locales al wiki.
- **No links a codigo fuente**: Para referenciar codigo, usar source attribution en prosa (ver abajo),
  NO un wikilink.
- **Links a fuentes raw**: Si se necesita referenciar un archivo en `docs/raw/`, usar path relativo
  al repo: `` `docs/raw/prd.md` `` (en backticks, no wikilink).

---

## Source attribution

Cada afirmacion concreta sobre el codigo debe citar su fuente:

```markdown
El action `addNewBooking` (en `lib/actions/bookings.ts:87`) recibe
`Omit<Reserva, "id" | "userId">` y automaticamente crea un pago inicial
si `montoSena > 0` (linea 110).
```

### Reglas de atribucion

- **Formato**: `` `archivo/relativo.ts:nro_linea` `` en backticks.
- **Path**: Relativo a la raiz del proyecto.
- **No especular**: Si un dato no se puede verificar leyendo el archivo citado, no incluirlo. Si es
  relevante pero no verificable, marcarlo explicitamente:
  ```markdown
  > [!todo] Verificar
  > Parece que `syncBookingTotal` tambien se llama desde el webhook de Paddle,
  > pero no se confirmo en el codigo.
  ```
- **Citas de raw sources**: Formato igual pero apuntando a `docs/raw/`:
  `` `docs/raw/prd.md` — Seccion 5, "Funcionalidades por Modulo" ``.

---

## Longitud y estructura

- **Minimo**: ~30 lineas (una pagina de solo 10 lineas probablemente deberia fusionarse).
- **Maximo**: ~300 lineas. Si una pagina excede esto, dividirla en sub-paginas.
  Ejemplo: `features/payments.md` podria dividirse en `features/payments/overview.md` y
  `features/payments/mercado-pago.md`.
- **Estructura interna**:
  ```markdown
  # Titulo (H1, coincide con frontmatter.title)

  Parrafo introductorio: una o dos frases resumiendo que cubre esta pagina.

  ## Seccion principal (H2)
  Contenido...

  ### Sub-seccion (H3, solo si hace falta)
  Contenido...

  ## Otra seccion principal (H2)
  Contenido...
  ```
- **H1**: Exactamente uno, al inicio. Coincide con `title` del frontmatter.
- **H2**: Secciones principales. Idealmente 2-6 por pagina.
- **H3**: Solo si una seccion H2 es muy larga y necesita subdivision.
- **Listas**: Preferir listas con bullet points sobre parrafos densos para datos estructurados
  (inventarios, tablas, comparaciones).
- **Tablas**: Usar tablas markdown para datos tabulares (colecciones, actions, env vars, etc.).

---

## Tipos de pagina y sus contenidos esperados

### Inventory page (catalogos)
Ejemplo: `architecture/server-actions.md`, `database/collections.md`, `frontend/components.md`

- Tabla principal con columnas relevantes
- Cada item con: nombre, ubicacion (`file:line`), proposito en 1 frase
- Sin detalles de implementacion (eso va en la feature page correspondiente)
- Orden alfabetico o por dominio

### Feature page (flujos de negocio)
Ejemplo: `features/bookings.md`, `features/auth.md`, `payments/mercadopago.md`

- Explicacion del flujo: entradas → proceso → salidas
- Relaciones con otras features (wikilinks)
- Decisiones de diseno y por que se tomaron
- Gotchas especificos de la feature
- Referencias a los actions y colecciones involucradas

### Decision page (arquitectura)
Ejemplo: `architecture/overview.md`, `architecture/data-flow.md`

- Contexto: que problema se resolvia
- Decision tomada
- Alternativas consideradas y por que se descartaron
- Consecuencias

### Gotcha page
Ejemplo: `architecture/gotchas.md`

- Cada gotcha en una lista con formato:
  ```markdown
  - **Titulo del gotcha**: Descripcion. Causa. Workaround. Fuente: `archivo.ts:nro`.
  ```

### Concept page (tipos, definiciones)
Ejemplo: `database/types.md`

- Definicion del concepto/type
- Campos principales
- Donde se usa (wikilinks a features/actions)

---

## No incluir

- Tutoriales paso a paso ("Como hacer X")
- Documentacion de librerias externas (Next.js, Appwrite, shadcn, etc.)
- Codigo fuente copiado textualmente (para eso esta el repo)
- Opiniones no respaldadas por codigo o raw sources
- Informacion duplicada entre paginas (preferir wikilinks)

---

## Marcadores especiales

| Marcador | Uso |
|----------|-----|
| `> [!todo]` | Dato que falta verificar o agregar |
| `> [!note]` | Aclaracion no obvia |
| `> [!warning]` | Gotcha o riesgo que rompe algo |

---

## Idioma

- Las paginas se escriben en **espanol** (idioma principal del proyecto).
- Los nombres de archivos, funciones, variables y paths se mantienen en su idioma original (ingles/codigo).
- Los tags del frontmatter van en ingles para consistencia con el ecosistema de herramientas.
