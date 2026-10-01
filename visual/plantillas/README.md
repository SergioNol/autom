# Plantillas HTML → JPEG

La IA genera el fondo o la ilustración; estas plantillas ponen el texto y el logo (los modelos de imagen deforman tipografías y logos).
`scripts/lib/imagenes/plantillas.ts` las renderiza en Chromium al tamaño exacto de cada red y guarda un JPEG.

| Plantilla | Uso |
|---|---|
| `titular.html` | Imagen de fondo + etiqueta, titular y subtítulo arriba (velo claro), logo abajo. Portadas, posts de imagen y diapositivas de Caso real. |
| `limpia.html` | Solo la imagen y el logo. Parodia y fotos que hablan por sí solas. |
| `texto.html` | Texto grande sobre gris claro (la foto, si hay, queda muy tenue). Diapositivas interiores de carrusel. |
| `feature.html` | Fondo desenfocado o sólido + titular arriba + tarjeta de interfaz de APES Admin flotando. Serie Feature. |
| `resultado.html` | Cifra enorme (se ajusta sola al ancho) + línea de contexto. Serie Resultado. |

Todas respetan un margen de seguridad del 10 % y pintan la etiqueta de la serie (píldora) cuando el post tiene `serie`.

Variables disponibles: `{{titulo}}`, `{{subtitulo}}`, `{{tarjeta}}`, `{{detalle}}`, `{{etiqueta}}`, `{{fondo}}`, `{{logo}}`, `{{ancho}}`, `{{alto}}`, `{{tipografia}}`,
`{{color_primario}}`, `{{color_secundario}}`, `{{color_acento}}`, `{{color_texto}}`, `{{clase_fondo}}`, `{{clase_logo}}`, `{{clase_etiqueta}}`.
Colores, tipografía y ruta del logo (el isotipo circular) salen de `config.json` → `marca`.

Prueba local sin gastar en la API: `npm run materializar -- AAAA-MM --simular`.
