Genera el lote {{LOTE}} siguiendo CLAUDE.md. Trabajas sin supervisión: no hagas preguntas.

1. Lee todo lo indicado en "Antes de generar" de CLAUDE.md, incluido `generacion/{{LOTE}}/aprendizaje.md`.
2. El calendario ya está fijado en `generacion/{{LOTE}}/calendario.json`: un post por cada `slot` (carpeta, red y fecha). No cambies fechas ni redes.
3. Escribe `generacion/{{LOTE}}/plan.json` con el formato de la sección "Plan del lote" de CLAUDE.md.
4. Ejecuta `npm run validar-plan -- {{LOTE}}` y corrige hasta que diga que es válido.
5. No generes imágenes ni escribas en `posts/`: eso lo hace el workflow a partir del plan.
