# Contenido APES

Generación mensual de contenido para Instagram y LinkedIn, con aprobación humana en Pull Request y publicación automática.
Todo vive en GitHub: sin servidor, base de datos ni panel.

```
día 20 ─ generar.yml ─┬─ aprendizaje (Claude Code) ──► PR aparte con cambios a la guía, si los hay
                      ├─ plan del lote (Claude Code) ─► generacion/AAAA-MM/plan.json
                      ├─ imágenes (gpt-image-2.5-sunburst) + plantillas HTML → JPEG
                      └─ posts/AAAA-MM/* ──► PR "Contenido AAAA-MM" (revisor: aprobador)
aprobador ─ edita / rechaza / deja tal cual ──► merge a main
cada hora ─ publicar.yml ─► publica lo aprobado cuya hora llegó ──► commit del estado en main
lunes ─ tokens.yml ─► avisa si un token caduca o la versión de API de LinkedIn envejece
```

> Repo público: todo su contenido (incluidos los posts sin publicar) es visible. Credenciales solo en GitHub Secrets.

## Estructura

| Ruta | Qué es |
|---|---|
| `CLAUDE.md` | Instrucciones de generación para Claude |
| `config.json` | Calendario (días y horas), modelo y calidad de imagen, marca, versiones de API, aprobador |
| `marca/`, `visual/`, `referencias/`, `brief-del-mes.md` | Voz, pilares, audiencia, estilo, plantillas, referencias y brief |
| `posts/AAAA-MM/AAAA-MM-DD-red-NN/` | Cada post: `post.md` + `imagen-N.jpg` |
| `generacion/AAAA-MM/` | Calendario, plan, aprendizaje del mes, costos y variantes alternativas |
| `aprendizaje/` | Lecciones y pares antes/después |
| `prompts/` | Prompts de Claude Code para los workflows |
| `scripts/` | CLI en TypeScript (Node ≥ 22.18, sin build) y `scripts/lib/` con la lógica y sus tests |

## Comandos

```bash
npm install
npm run preparar -- 2026-11                 # calendario del lote
npm run validar-plan -- 2026-11             # valida generacion/2026-11/plan.json
npm run materializar -- 2026-11 --simular   # posts + JPEG sin llamar a OpenAI
npm run validar                             # valida todos los posts
npm run descripcion-pr -- 2026-11           # descripción del PR
npm run publicar -- --simular               # qué se publicaría ahora
npm test && npm run typecheck
```

## Decisiones

| Tema | Decisión |
|---|---|
| Horarios | Martes y jueves; LinkedIn 09:00, Instagram 13:00 (CDMX). Se cambian en `config.json` |
| Imágenes | `gpt-image-2.5-sunburst`, calidad `high`, 2 variantes solo en la portada (la alternativa va en el PR) |
| Tamaños | Instagram 1080×1350 (4:5), LinkedIn 1200×1200 |
| Texto sobre imagen | Plantillas HTML renderizadas con Chromium (nunca el modelo) |
| Calendario | Determinista desde `config.json`; Claude solo decide contenido |
| Retrasos | Si un post aprobado lleva más de 24 h sin publicarse, pasa a `fallido` ("fecha vencida") |
| Reintentos | 3 por publicación, solo ante errores HTTP transitorios (nunca ante errores de red, para no duplicar) |
| Alertas | Correos nativos de GitHub: PR asignado, Action fallida (publicación fallida o token por caducar) |

Puesta en marcha: [SETUP.md](SETUP.md).
