// Uso: node scripts/verificar-tokens.ts
// Falla (y GitHub avisa por correo) si un token caduca pronto o la versión de la API de LinkedIn está por retirarse.
import { leerConfig } from './lib/config.ts';

const DIAS_AVISO = 14;
const DIA_MS = 86_400_000;
const config = leerConfig();
const problemas: string[] = [];
const avisar = (mensaje: string) => {
  problemas.push(mensaje);
  console.error(`✗ ${mensaje}`);
};

function revisarCaducidad(nombre: string, expiraMs: number | null) {
  if (expiraMs === null) return console.log(`✓ ${nombre}: sin caducidad`);
  const dias = Math.floor((expiraMs - Date.now()) / DIA_MS);
  if (dias < DIAS_AVISO) avisar(`${nombre} caduca en ${dias} días (${new Date(expiraMs).toISOString().slice(0, 10)}). Renuévalo y actualiza el secreto.`);
  else console.log(`✓ ${nombre}: caduca en ${dias} días`);
}

async function instagram() {
  const token = process.env.IG_ACCESS_TOKEN;
  if (!token) return console.log('- Instagram: sin IG_ACCESS_TOKEN, se omite');
  const url = `https://graph.facebook.com/${config.publicacion.instagramGraphVersion}/debug_token?input_token=${encodeURIComponent(token)}`;
  const respuesta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const { data } = (await respuesta.json()) as { data?: { is_valid?: boolean; expires_at?: number } };
  if (!respuesta.ok || !data?.is_valid) return avisar('El token de Instagram no es válido.');
  revisarCaducidad('Token de Instagram', data.expires_at ? data.expires_at * 1000 : null);
}

async function linkedin() {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) return console.log('- LinkedIn: sin LINKEDIN_ACCESS_TOKEN, se omite');
  const { LINKEDIN_CLIENT_ID: clientId, LINKEDIN_CLIENT_SECRET: clientSecret, LINKEDIN_TOKEN_EXPIRA: expiraManual } = process.env;

  if (clientId && clientSecret) {
    const respuesta = await fetch('https://www.linkedin.com/oauth/v2/introspectToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, token }),
    });
    const datos = (await respuesta.json()) as { active?: boolean; expires_at?: number };
    if (!respuesta.ok || !datos.active) return avisar('El token de LinkedIn no está activo.');
    return revisarCaducidad('Token de LinkedIn', datos.expires_at ? datos.expires_at * 1000 : null);
  }
  if (expiraManual) return revisarCaducidad('Token de LinkedIn', Date.parse(expiraManual));
  avisar('No se puede verificar el token de LinkedIn: configura LINKEDIN_CLIENT_ID/SECRET o la variable LINKEDIN_TOKEN_EXPIRA (AAAA-MM-DD).');
}

/** LinkedIn retira cada versión de su API aproximadamente un año después de publicarla. */
function versionLinkedIn() {
  const v = config.publicacion.linkedinVersion;
  const publicada = Date.UTC(Number(v.slice(0, 4)), Number(v.slice(4, 6)) - 1, 1);
  const meses = Math.floor((Date.now() - publicada) / (30 * DIA_MS));
  if (meses >= 10) avisar(`La versión ${v} de la API de LinkedIn tiene ${meses} meses; actualiza publicacion.linkedinVersion en config.json.`);
  else console.log(`✓ Versión de API de LinkedIn ${v} (${meses} meses)`);
}

await instagram();
await linkedin();
versionLinkedIn();
if (problemas.length > 0) process.exitCode = 1;
