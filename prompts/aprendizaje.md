Paso de aprendizaje antes de generar el lote {{LOTE}}. Lote anterior: {{LOTE_PREVIO}}.
Sigue la sección "Aprendizaje" de CLAUDE.md. Trabajas sin supervisión: no hagas preguntas.

1. Si no existe `posts/{{LOTE_PREVIO}}/`, escribe en `generacion/{{LOTE}}/aprendizaje.md` una sola línea: "Primer lote: sin aprendizaje previo." y termina.
2. Reúne las señales del lote anterior:
   - Estados y `comentario_revision` de cada `posts/{{LOTE_PREVIO}}/*/post.md`.
   - Ediciones del aprobador: `git diff lote-{{LOTE_PREVIO}}-generado origin/main -- posts/{{LOTE_PREVIO}}` (si la etiqueta no existe, dilo y sigue solo con estados y comentarios).
   - Imágenes reemplazadas: archivos `imagen-N.jpg` que aparecen en ese diff.
   - Resultado de la publicación: `publicado` / `fallido` y su `error`.
3. Añade al final de `aprendizaje/lecciones.md` una sección `## {{LOTE}} (sobre {{LOTE_PREVIO}})` con patrones y evidencia. Nunca borres entradas anteriores.
4. Escribe `aprendizaje/ediciones/{{LOTE_PREVIO}}.md` con los pares antes/después más instructivos (caption original → caption final, con una línea de por qué).
5. Copia a `referencias/<red>/` los mejores posts aprobados **sin cambios**: `{{LOTE_PREVIO}}-<carpeta>.jpg` (su imagen-1.jpg) y `{{LOTE_PREVIO}}-<carpeta>.md` (el caption). Mantén como máximo 15 por red: borra las referencias más antiguas si te pasas.
6. Solo si un patrón se repite (2 o más casos) o un comentario lo pide explícitamente, edita `marca/voz.md`, `marca/pilares.md` o `visual/guia-estilo.md`. Esos cambios se separan automáticamente en otro Pull Request para que el equipo decida. Una sola edición no es una regla.
7. Escribe `generacion/{{LOTE}}/aprendizaje.md` (máx. 15 líneas, en español, para la descripción del PR): qué se aprendió, qué cambia en este lote y qué cambios de guía se proponen.
