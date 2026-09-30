# Guía de estilo visual

> Colores, tipografía y logo se configuran en `config.json` → `marca` (las plantillas los leen de ahí).
> PENDIENTE: confirmar la paleta real y subir el logo a `visual/logo/logo.png` (PNG con fondo transparente); después, `marca.confirmada: true`.

## Paleta (provisional)

| Uso | Color |
|---|---|
| Primario | `#0B2545` (azul marino) |
| Secundario | `#13315C` |
| Acento | `#F2A541` (ámbar) |
| Texto sobre color | `#FFFFFF` |

## Tipografía (solo en plantillas)

- Inter: 800 para titulares y 500 para subtítulos.

## Estilo fotográfico

- Fotografía editorial realista y luminosa: oficinas, bodegas, mostradores y escritorios de pymes mexicanas reales.
- Luz natural, colores sobrios con algún acento cálido y composición limpia con espacio negativo.
- Evitar: stock genérico de apretones de manos, hologramas y "tecnología futurista", pantallas con interfaces inventadas.

## Prompt base

```
Editorial photograph, realistic, natural soft daylight, clean composition with generous negative space,
subtle deep navy and warm amber color accents, small and medium businesses in Mexico, authentic everyday work setting,
shallow depth of field, high detail. No text, no letters, no numbers, no logos, no watermarks, no user interfaces on screens.
```

Añadir siempre: la escena concreta y dónde dejar espacio libre para el texto (p. ej. "empty space in the lower third").

## Nunca

- Texto, letras o logos generados por el modelo (van en las plantillas HTML).
- Personas que simulen ser el equipo de APES.
- Capturas de pantalla inventadas del producto.

## Formatos

| Red | Formato final | Tamaño |
|---|---|---|
| Instagram | Vertical 4:5 | 1080×1350 |
| LinkedIn | Cuadrado | 1200×1200 |
