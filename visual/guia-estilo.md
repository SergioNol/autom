# Guía de estilo visual

> Colores, tipografía y logo se configuran en `config.json` → `marca` (las plantillas los leen de ahí).
> Paleta tomada de la web y el logo de Apesdev (2026-10-01).

## Paleta

| Uso | Color |
|---|---|
| Primario | `#111827` (gris carbón) |
| Secundario | `#1F2937` |
| Acento | `#FF5757` (coral, el punto del logo) |
| Texto sobre color | `#FFFFFF` |

## Logo

| Archivo | Uso |
|---|---|
| `visual/logo/logo.png` | Original (negro y coral, fondo transparente), para fondos claros |
| `visual/logo/logo-blanco.png` | Versión blanca con el punto coral: la usan las plantillas (`config.json` → `marca.logo`) |

## Tipografía (solo en plantillas)

- Poppins (la más cercana al logo en Google Fonts): 800 para titulares y 500 para subtítulos.

## Estilo fotográfico

- Fotografía editorial realista y luminosa: oficinas, bodegas, mostradores y escritorios de pymes mexicanas reales.
- Luz natural, colores sobrios y neutros con algún acento coral y composición limpia con espacio negativo.
- Evitar: stock genérico de apretones de manos, hologramas y "tecnología futurista", pantallas con interfaces inventadas.

## Prompt base

```
Editorial photograph, realistic, natural soft daylight, clean composition with generous negative space,
neutral tones with subtle charcoal and soft coral color accents, small and medium businesses in Mexico, authentic everyday work setting,
shallow depth of field, high detail. No text, no letters, no numbers, no logos, no watermarks, no user interfaces on screens.
```

Añadir siempre: la escena concreta y dónde dejar espacio libre para el texto (p. ej. "empty space in the lower third").
En la plantilla `titular` el logo va arriba a la izquierda y el texto en el tercio inferior: pide ambas zonas despejadas.

Con imagen de referencia (`referencias` en el plan), añadir:

```
Use the reference image only as a guide for style, lighting, color palette and composition.
Create a new scene; do not copy its text, logos, products or people.
```

## Nunca

- Texto, letras o logos generados por el modelo (van en las plantillas HTML).
- Personas que simulen ser el equipo de APES.
- Capturas de pantalla inventadas del producto.

## Formatos

| Red | Formato final | Tamaño |
|---|---|---|
| Instagram | Vertical 4:5 | 1080×1350 |
| LinkedIn | Cuadrado | 1200×1200 |
