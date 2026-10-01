# Referencias

Imágenes de estilo por red. **Basta con soltar imágenes en la carpeta de cada red**: el sistema las usa solo.

```
referencias/
  instagram/   ← imágenes de referencia para Instagram (.jpg, .jpeg, .png, .webp)
  linkedin/    ← imágenes de referencia para LinkedIn
```

## Cómo se usan

- Al generar, cada post con imagen IA recibe **una** referencia de la carpeta de su red, **por turnos** (en orden alfabético y de calendario): posts seguidos usan referencias distintas y cada mes empieza en una posición diferente.
- Un carrusel usa la misma referencia en todas sus diapositivas.
- El modelo la toma solo como guía de estilo, luz, color y composición: crea una imagen nueva y no copia textos, logos, productos ni personas.
- No se asignan a la serie Caso real (los simios usan `visual/personajes/`) ni a imágenes que ya traen `referencias` en el plan.
- La referencia usada aparece al ejecutar `npm run materializar` (también con `--simular`) y en `prompt_imagen` de cada `post.md`.

## Buenas prácticas

- Nombres descriptivos, sin espacios: `2026-09-tips-inventario.jpg`.
- Opcional: un `.md` con el mismo nombre con el caption o por qué es referencia (el `.md` no se envía al modelo; lo lee Claude al planificar).
- Recorta marcos de móvil e interfaces de la red: solo la imagen del post.
- Mantén entre 10 y 15 por red y retira las más antiguas. El paso de aprendizaje propone añadir aquí los posts aprobados sin cambios (vía Pull Request).
- El repo es público: no subas imágenes de otras marcas que no quieras publicar; déjalas solo en tu equipo.
