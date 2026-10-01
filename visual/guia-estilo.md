# Guía de estilo visual

> Fuente: "Guía de generación de imágenes – Apes" (2026-10-01), adaptada al sistema. Se aplica a **todas** las imágenes de Instagram y LinkedIn.
> Colores, tipografía y logos se configuran en `config.json` → `marca` (las plantillas los leen de ahí).

## Contexto

Apes es una empresa mexicana de software y consultoría que implementa **APES Admin** para automatizar y ordenar la operación de pymes: cobranza, facturación, inventario, aprobaciones y procesos internos.

- **Tono:** inteligente, directo, con humor seco.
- **Estética de referencia:** feeds de software premium: luminosos, mucho espacio vacío, tipografía grande, interfaz flotando sobre fondos limpios.
- **Nada de** estética corporativa genérica ni foto de stock.

## Reglas generales (todas las imágenes)

- **Paleta:** carbón `#111827`, gris claro `#F3F4F6`, coral `#FF5757`, blanco y negro. **Máximo 3 colores por imagen.** Fondos claros por defecto.
- **Tipografía:** Poppins (sans-serif geométrica, la más cercana al logo). Titulares grandes, **máximo 8 palabras** (lo valida `validar-plan`).
- **Texto en la imagen:** solo el indicado, escrito exactamente igual y en español. Lo ponen las **plantillas HTML** (texto exacto, sin faltas). El modelo de imagen no escribe texto, **salvo** el detalle de la serie Parodia.
- **Composición:** un solo elemento protagonista, mucho espacio negativo, nada abarrotado.
- **Margen de seguridad:** 10 % libre en todos los bordes (la cuadrícula del perfil recorta). Las plantillas ya lo respetan; los prompts deben pedirlo.
- **Prohibido:** logos o marcas reales (también WhatsApp, Excel, bancos…), personas reales identificables, celebridades, escudos de equipos, autos o uniformes con patrocinadores reales, marcas de agua, personas que simulen ser el equipo de Apes.

## Formatos

| Uso | Tamaño | Notas |
|---|---|---|
| Instagram feed | 1080×1350 (4:5) | Lo importante, centrado: debe funcionar recortado a 3:4 |
| LinkedIn post | 1080×1350 (4:5) | Se usa 4:5 siempre (ocupa más pantalla y es el mismo formato que los carruseles) |
| Carrusel (ambas redes) | 1080×1350 por diapositiva | Mismo fondo y estilo en todas |

**Fuera de alcance por ahora:** video, portadas de reel y stories. No se planifican ni se generan.

## Series mensuales

Cada mes, en total entre las dos redes: **3 Feature, 3 Caso real, 2 Resultado y 1 Parodia** (9 posts). El resto del calendario se completa con posts sin serie (ver más abajo). Reparte las series entre Instagram y LinkedIn.

| Serie (`serie` en el plan) | Etiqueta (píldora) | Pilar | Formato | Plantillas |
|---|---|---|---|---|
| `feature` | Feature | `producto` | imagen | `feature` (portada) |
| `caso-real` | Caso real | `producto` o `tips` | carrusel de 3 a 5 (ideal) | `titular` en todas, fuente `ia` |
| `resultado` | Resultado | `casos-de-exito` | imagen | `resultado`, fuente `sin-fondo` |
| `parodia` | sin etiqueta | `marca` | imagen | `limpia`, fuente `ia` |

La etiqueta la pone la plantilla según `serie`: no la escribas en los textos.

### 1. Feature (3 al mes)

Un solo componente de interfaz de APES Admin (tarjeta, notificación, confirmación de flujo completado) flotando sobre un fondo de color sólido o sobre una foto desenfocada de un entorno de trabajo real. Muestra el **resultado** ("Cierre de mes completado"), nunca menús ni pantallas completas.

- La tarjeta la dibuja la plantilla `feature` (esquinas redondeadas, sombra suave, mucho blanco): `textos.titulo` = titular de una línea arriba; `textos.tarjeta` = texto principal de la tarjeta (máx. 40 caracteres); `textos.detalle` = línea secundaria opcional (máx. 60). Sin cifras inventadas.
- Fondo: `sin-fondo` (gris claro sólido, coste cero) o `ia` con el prompt de fondo Feature (la plantilla lo desenfoca y aclara).

```
Bright, airy photograph of a real small business work environment in Mexico (office desk, shop counter or tidy warehouse),
soft natural daylight, very shallow depth of field with strong background blur, light neutral tones with a subtle coral accent,
no people in focus, calm and empty center for a floating interface card. No text, no letters, no numbers, no logos, no brands,
no watermarks, no screens with interfaces.
```

### 2. Caso real con simios (3 al mes, idealmente carrusel de 3 a 5)

Simios en claymorphism viviendo un problema operativo concreto. Humor visual, nunca infantil.

- **Diapositiva 1:** el simio sufre un problema concreto (ahogado en facturas, rodeado de chats, frente a una hoja de cálculo infinita, persiguiendo pagos).
- **Intermedias:** el problema escala.
- **Última:** el mismo simio, tranquilo, con todo resuelto.
- Todas las diapositivas: fuente `ia`, plantilla `titular` (titular arriba, máx. 8 palabras). Las diapositivas 2 a N se generan automáticamente con la 1 como referencia, para que el personaje sea el mismo.
- Si existe `visual/personajes/<nombre>.jpg`, inclúyelo en `referencias` de **todas** las diapositivas.
- Sin marcas reales: "chats genéricos sin logos de ninguna app", "hoja de cálculo genérica".
- Es un caso **típico**, no de un cliente: el caption no puede presentar a un cliente, cifras ni testimonios inventados.

**Personajes (reparto fijo).** Un carrusel tiene un solo protagonista, siempre igual en todas sus diapositivas. Elige al personaje según el área del problema y rota entre ellos durante el mes; otro puede aparecer como secundario.

| Nombre | Especie | Descripción para el prompt | Área |
|---|---|---|---|
| Rafa | Gorila | silverback gorilla with charcoal-gray fur, white shirt with rolled-up sleeves, thick black-rimmed glasses, coral wristwatch | Dirección: aprobaciones, cierre de mes, visibilidad del negocio |
| Chela | Chimpancé | chimpanzee with dark brown fur, coral knit sweater, small headset with microphone | Cobranza y atención a clientes |
| Toño | Orangután | orangutan with muted rust-brown fur, charcoal-gray work overalls, pencil behind the ear | Almacén e inventario |
| Lupe | Mono capuchino | capuchin monkey with cream and brown fur, white blouse, small calculator | Contabilidad y facturación |

```
3D claymorphism render, matte plasticine texture, soft diffuse studio lighting, smooth seamless plain background in light gray,
palette limited to white, light gray, charcoal and coral, one main character, generous negative space,
witty and sophisticated visual humor, not childish. Character: <descripción del personaje>, <expresión>. Scene: <situación>.
Keep the top third of the frame empty for a headline and all key elements inside the central 80% of the frame.
No text, no letters, no numbers, no logos, no real brands or app icons, no watermarks.
```

### 3. Resultados / números (2 al mes)

Una cifra enorme como protagonista y una línea pequeña de contexto debajo, sobre un degradado sutil de la paleta.

- Plantilla `resultado`, fuente `sin-fondo` (coste cero): `textos.titulo` = la cifra ("-72%"); `textos.subtitulo` = el contexto ("de tiempo en el cierre de mes").
- **Solo cifras exactas del brief** (`brief-del-mes.md`), con cliente autorizado. Sin cifras en el brief, no hay serie Resultado ese mes: sustitúyela por Feature o Caso real y avísalo en `notas`.

### 4. Parodia de branding (1 al mes)

Render hiperrealista y ultrapremium, estilo campaña de lujo o patrocinio deportivo, aplicado a algo absurdamente cotidiano de una pyme (un auto de carreras hecho de cajas de archivo, el lanzamiento de lujo de una factura, un espectacular gigante celebrando "3 clientes"). La ironía se entiende sin leer el caption.

- Plantilla `limpia` (solo el logo), sin etiqueta.
- Es la **única** serie en la que el modelo escribe texto: un detalle que delate el chiste (etiqueta, letrero o texto pequeño), en español, citado exacto en el prompt. El aprobador revisa la ortografía.
- Marcas y patrocinadores siempre **inventados**.

```
Hyperrealistic, ultra-premium luxury advertising campaign photograph (or sports sponsorship campaign), dramatic yet clean studio
lighting, high-end retouching, generous negative space, palette limited to white, charcoal and coral, applied to an absurdly
mundane small-business object: <objeto y escena>. The only text in the image is "<texto exacto>", small, on <etiqueta / letrero>.
Only invented brands. Keep all key elements inside the central 80% of the frame. No real logos, no real brands, no real or
identifiable people, no watermarks.
```

## Posts sin serie

Completan el calendario después de las series. No llevan etiqueta.

- **Tips** (`tips`): carrusel con portada `titular` y diapositivas interiores `texto` sin fondo, o imagen única. Para la imagen `ia`, usa el prompt base general.
- **Equipo y cultura** (`equipo-cultura`): solo fotos reales de `visual/fotos-reales/` con plantilla `limpia` o `titular`. Nunca personas generadas que simulen ser el equipo.

```
Bright, clean, premium software-brand aesthetic, one single hero element, generous negative space, soft studio or natural daylight,
palette limited to white, light gray, charcoal and coral accents, small and medium businesses in Mexico.
Keep the top third empty for a headline and all key elements inside the central 80% of the frame.
No text, no letters, no numbers, no logos, no brands, no watermarks, no real or identifiable people, no user interfaces on screens.
```

## Imágenes de referencia

Con referencias en el plan (`referencias`: personajes, posts de `referencias/`), añade al prompt:

```
Use the reference image only as a guide for style, lighting, color palette and composition.
Create a new scene; do not copy its text, logos, products or people.
```

Para un personaje de `visual/personajes/`, en cambio: "Keep exactly the same character as in the reference image (species, fur, clothing, accessories, clay texture)".

## Pedidos sueltos

Cuando alguien pida una imagen con el formato
`Serie: [nombre] | Formato: [IG feed / LinkedIn / carrusel] | Escena: [descripción] | Texto exacto: [texto o "ninguno"]`,
tradúcelo a un post del plan con su `serie`, plantilla, prompt de la serie y `textos` copiados literalmente. "Ninguno" = plantilla `limpia`.

## Logo

| Archivo | Uso |
|---|---|
| `visual/logo/logo.png` | Original (negro y coral). Lo usan las plantillas sobre fondo claro (`marca.logo`) |
| `visual/logo/logo-blanco.png` | Blanco con el punto coral, para fotos (plantilla `limpia`, `marca.logoBlanco`) |
| `visual/logo/isotipo.png` | Isotipo (círculo coral con estrella blanca). No lo usan las plantillas; disponible para avatares o un detalle de marca |

## Nunca

- Texto generado por el modelo fuera de la serie Parodia.
- Logos o marcas reales, personas reales identificables o personas que simulen ser el equipo.
- Pantallas completas o menús inventados del producto (solo componentes sueltos en la plantilla `feature`).
- Más de 3 colores, fondos oscuros por defecto, estética de stock.
