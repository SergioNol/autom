# Plantillas HTML → JPEG

La IA genera el fondo o la ilustración; estas plantillas ponen el texto y el logo (los modelos de imagen deforman tipografías y logos).
`scripts/lib/imagenes/plantillas.ts` las renderiza en Chromium al tamaño exacto de cada red y guarda un JPEG.

| Plantilla | Uso |
|---|---|
| `titular.html` | Imagen de fondo + titular y subtítulo abajo, logo arriba. Portadas y posts de imagen. |
| `limpia.html` | Solo la imagen y el logo pequeño. Fotos que hablan por sí solas. |
| `texto.html` | Texto grande sobre el color de marca (la foto, si hay, queda muy tenue). Diapositivas de carrusel. |

Variables disponibles: `{{titulo}}`, `{{subtitulo}}`, `{{fondo}}`, `{{logo}}`, `{{ancho}}`, `{{alto}}`, `{{tipografia}}`,
`{{color_primario}}`, `{{color_secundario}}`, `{{color_acento}}`, `{{color_texto}}`, `{{clase_fondo}}`, `{{clase_logo}}`.
Colores, tipografía y ruta del logo salen de `config.json` → `marca`.

Prueba local sin gastar en la API: `npm run materializar -- AAAA-MM --simular`.
