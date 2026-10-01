# Puesta en marcha

Pasos únicos para dejar el sistema funcionando. Tiempo estimado: 1 hora, más la espera de aprobación de Meta y LinkedIn.

## 1. Repositorio (5 min)

```bash
gh repo create <org>/contenido-apes --public --source . --push
```

Público porque las Actions son gratis y Instagram necesita URLs públicas de las imágenes (`raw.githubusercontent.com`).
Todo lo que hay en el repo es visible, incluidos los posts aún no publicados.

## 2. Aprobador

En `config.json`, pon el usuario de GitHub del aprobador en `"aprobador"` (se asigna como revisor de cada PR).

## 3. Secretos (Settings → Secrets and variables → Actions)

| Secreto | Para | Dónde se obtiene |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude Code en `generar.yml` | console.anthropic.com |
| `OPENAI_API_KEY` | Imágenes `gpt-image-2.5-sunburst` | platform.openai.com (la organización debe estar verificada para modelos de imagen) |
| `IG_ACCESS_TOKEN` | Publicar en Instagram | Token de página de larga duración (ver paso 5) |
| `IG_USER_ID` | Publicar en Instagram | ID de la cuenta de Instagram Business |
| `LINKEDIN_ACCESS_TOKEN` | Publicar en LinkedIn | OAuth con `w_organization_social` (ver paso 6) |
| `LINKEDIN_ORG_ID` | Publicar en LinkedIn | Número de la URL de admin de la página: `linkedin.com/company/<ID>/admin` |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | Verificar la caducidad del token | App de LinkedIn → Auth |
| `DEPLOY_KEY` | Que `publicar.yml` haga commit en `main` protegida | Paso 4 |

## 4. Proteger `main` (Settings → Rules → Rulesets → New branch ruleset)

1. Target: `main`. Activa **Require a pull request before merging** (1 aprobación) y **Require status checks to pass** → `validar`. Activa también **Block force pushes**.
2. Crea una deploy key: `ssh-keygen -t ed25519 -f deploy_key -N ""`.
   - Clave pública (`deploy_key.pub`): Settings → Deploy keys → Add, con **Allow write access**.
   - Clave privada (`deploy_key`): como secreto `DEPLOY_KEY`. Después borra ambos archivos locales.
3. En el ruleset, en **Bypass list**, añade **Deploy keys**: así solo la Action de publicación puede escribir los estados en `main`.
4. Cuando se sume un segundo aprobador, sube las aprobaciones requeridas a 2.
5. Settings → Actions → General → **Workflow permissions**: activa *Allow GitHub Actions to create and approve pull requests* (necesario para abrir el PR del lote).

## 5. Instagram (inícialo hoy; la revisión de Meta tarda semanas)

1. La cuenta de Instagram debe ser **Business o Creator** y estar vinculada a una página de Facebook.
2. En developers.facebook.com crea una app de tipo *Business* y añade el producto **Instagram** (API con inicio de sesión de Facebook).
3. Permisos: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`. Envía la app a **App Review** con un vídeo del flujo.
4. Con el Graph API Explorer, obtén un token de usuario, cámbialo por uno de larga duración y pide el token de la página (los tokens de página derivados de uno de larga duración no caducan).
5. `IG_USER_ID`: `GET /me/accounts?fields=instagram_business_account`.
6. Límite: 25 publicaciones por API cada 24 h (usamos unas 2 por semana).

## 6. LinkedIn (inícialo hoy)

1. En linkedin.com/developers crea una app asociada a la página de empresa (un admin de la página debe verificarla).
2. Solicita el producto **Community Management API** (requiere aprobación de LinkedIn).
3. Genera un token OAuth 2.0 con el scope `w_organization_social`, con un usuario administrador de la página.
4. Caduca a los ~60 días: `tokens.yml` avisa cada lunes si faltan menos de 14 días. Si no configuras `LINKEDIN_CLIENT_ID/SECRET`, crea la variable `LINKEDIN_TOKEN_EXPIRA` (AAAA-MM-DD).
5. LinkedIn retira cada versión de la API al cabo de un año: `tokens.yml` avisa cuando toca actualizar `publicacion.linkedinVersion` en `config.json`.

## 7. Marca (antes del primer lote)

- Hecho (2026-10-01): logo en `visual/logo/` (original y versión blanca para las plantillas), colores y tipografía en `config.json` → `marca`.
- Revisar las propuestas de `marca/voz.md`, `marca/pilares.md`, `marca/audiencia.md` y `visual/guia-estilo.md`; quitar las marcas `PENDIENTE`.
- 10 a 15 posts de referencia por red en `referencias/`.
- Fotos reales del equipo en `visual/fotos-reales/`.
- Rellenar `brief-del-mes.md` antes de cada día 20.

## 8. Primera prueba (local, ~US$ 0.50)

Genera **un post por red** (el primero de cada una) con una imagen hecha a partir de una referencia. Solo necesita `OPENAI_API_KEY`.

1. Copia `.env.example` como `.env` y pon tu clave de OpenAI. `.env` está en `.gitignore`: nunca se sube.
2. Guarda una imagen de referencia por red (JPG; un post o una foto con el estilo que quieres):
   - `referencias/linkedin/referencia-prueba.jpg`
   - `referencias/instagram/referencia-prueba.jpg`
3. Ejecuta:

   ```bash
   npm run preparar -- 2026-11 --prueba         # calendario con 1 post por red
   # Claude escribe generacion/2026-11/plan.json (o reutiliza el que ya hay)
   npm run validar-plan -- 2026-11
   npm run materializar -- 2026-11 --simular    # gratis: comprueba textos y plantillas
   rm -r posts/2026-11                          # borra la simulación (si no, no se regenera)
   npm run materializar -- 2026-11              # real: llama a OpenAI
   npm run validar -- 2026-11
   ```

4. Revisa `posts/2026-11/*/imagen-1.jpg`, la variante alternativa en `generacion/2026-11/variantes/` y el gasto en `generacion/2026-11/costos.json`.
5. Al terminar, borra la prueba para que no se cuele en el lote real: `rm -r posts/2026-11 generacion/2026-11` (y las referencias de prueba, si no las quieres conservar).

Después, en GitHub: Actions → **generar** → *Run workflow* con el lote. Revisa el PR, ajusta `imagenes.calidad` en `config.json` (`high` / `xhigh` / `max`) según el resultado y el gasto que muestra el PR. Actions → **publicar** → *Run workflow* con **simular** para ver qué se publicaría.
