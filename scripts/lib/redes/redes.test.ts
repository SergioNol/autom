import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { publicarInstagram } from './instagram.ts';
import { publicarLinkedIn } from './linkedin.ts';

const config = { instagramGraphVersion: 'v25.0', linkedinVersion: '202609', margenVencidoHoras: 24, intentos: 1 };
const fetchOriginal = globalThis.fetch;
let llamadas: { url: string; metodo: string; cuerpo: unknown; headers: Record<string, string> }[] = [];

/** Sustituye fetch por un servidor falso que responde según método y URL. */
function simularApi(responder: (url: string, metodo: string) => Response) {
  globalThis.fetch = (async (entrada: string | URL, init?: RequestInit) => {
    const url = String(entrada);
    const metodo = init?.method ?? 'GET';
    const cuerpo = typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body ? '<binario>' : undefined;
    llamadas.push({ url, metodo, cuerpo, headers: (init?.headers ?? {}) as Record<string, string> });
    return responder(url, metodo);
  }) as typeof fetch;
}

const json = (datos: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(datos), { status: 200, headers: { 'Content-Type': 'application/json', ...headers } });

beforeEach(() => {
  llamadas = [];
  Object.assign(process.env, { IG_ACCESS_TOKEN: 'tok-ig', IG_USER_ID: '17841', LINKEDIN_ACCESS_TOKEN: 'tok-li', LINKEDIN_ORG_ID: '999' });
});
afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

test('Instagram carrusel: un contenedor por imagen, contenedor CAROUSEL y media_publish; token solo en cabecera', async () => {
  let n = 0;
  simularApi((url, metodo) => {
    if (url.includes('fields=status_code')) return json({ status_code: 'FINISHED' });
    if (url.includes('fields=permalink')) return json({ permalink: 'https://instagram.com/p/xyz' });
    if (url.endsWith('/media_publish')) return json({ id: 'media-final' });
    if (metodo === 'POST' && url.endsWith('/media')) return json({ id: `c${++n}` });
    return new Response('no esperado', { status: 500 });
  });

  const resultado = await publicarInstagram(
    { caption: 'Hola #pymes', altText: 'alt', urls: ['https://raw/1.jpg', 'https://raw/2.jpg'], archivos: [] },
    config,
  );

  assert.deepEqual(resultado, { idExterno: 'media-final', url: 'https://instagram.com/p/xyz' });
  const posts = llamadas.filter((l) => l.metodo === 'POST');
  assert.deepEqual(posts[0]!.cuerpo, { image_url: 'https://raw/1.jpg', is_carousel_item: true, alt_text: 'alt' });
  assert.deepEqual(posts[2]!.cuerpo, { media_type: 'CAROUSEL', children: 'c1,c2', caption: 'Hola #pymes' });
  assert.deepEqual(posts[3]!.cuerpo, { creation_id: 'c3' });
  assert.ok(llamadas.every((l) => l.url.startsWith('https://graph.facebook.com/v25.0/') && !l.url.includes('tok-ig')));
  assert.ok(llamadas.every((l) => l.headers.Authorization === 'Bearer tok-ig'));
});

test('Instagram: un contenedor en ERROR aborta sin publicar', async () => {
  simularApi((url) => (url.includes('status_code') ? json({ status_code: 'ERROR' }) : json({ id: 'c1' })));
  await assert.rejects(
    publicarInstagram({ caption: 'x', altText: 'a', urls: ['https://raw/1.jpg'], archivos: [] }, config),
    /estado ERROR/,
  );
  assert.ok(!llamadas.some((l) => l.url.endsWith('/media_publish')));
});

test('LinkedIn: sube la imagen, crea el post con little text y devuelve la URN', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'li-'));
  const archivo = path.join(dir, 'imagen-1.jpg');
  await writeFile(archivo, Buffer.from([0xff, 0xd8, 0xff]));

  simularApi((url, metodo) => {
    if (url.includes('action=initializeUpload')) return json({ value: { uploadUrl: 'https://upload/abc', image: 'urn:li:image:I1' } });
    if (url === 'https://upload/abc' && metodo === 'PUT') return new Response(null, { status: 201 });
    if (url.endsWith('/rest/posts')) return new Response(null, { status: 201, headers: { 'x-restli-id': 'urn:li:share:77' } });
    return new Response('no esperado', { status: 500 });
  });

  const resultado = await publicarLinkedIn({ caption: 'Cierre (fácil) #ERP', altText: 'alt', urls: [], archivos: [archivo] }, config);

  assert.deepEqual(resultado, { idExterno: 'urn:li:share:77', url: 'https://www.linkedin.com/feed/update/urn:li:share:77/' });
  const post = llamadas.find((l) => l.url.endsWith('/rest/posts'))!;
  assert.equal(post.headers['LinkedIn-Version'], '202609');
  assert.deepEqual(post.cuerpo, {
    author: 'urn:li:organization:999',
    commentary: 'Cierre \\(fácil\\) {hashtag|\\#|ERP}',
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    content: { media: { id: 'urn:li:image:I1', altText: 'alt' } },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  });
});

test('un error HTTP se reporta con el cuerpo de la respuesta', async () => {
  simularApi(() => new Response('{"error":"token expirado"}', { status: 401 }));
  await assert.rejects(
    publicarInstagram({ caption: 'x', altText: 'a', urls: ['https://raw/1.jpg'], archivos: [] }, config),
    /HTTP 401 .*token expirado/,
  );
});
