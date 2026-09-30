import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { POST_VALIDO } from './fixtures.test-data.ts';
import { listarPosts } from './repositorio.ts';
import { validarPost } from './validacion.ts';

const PILARES = ['tips', 'casos-de-exito', 'producto', 'equipo-cultura'];
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

async function crearPost(carpeta: string, archivos: Record<string, string | Buffer>) {
  const dirPosts = await mkdtemp(path.join(tmpdir(), 'posts-'));
  const dir = path.join(dirPosts, '2026-11', carpeta);
  await mkdir(dir, { recursive: true });
  for (const [nombre, contenido] of Object.entries(archivos)) await writeFile(path.join(dir, nombre), contenido);
  const [post] = await listarPosts('2026-11', dirPosts);
  return validarPost(post!, dirPosts, PILARES);
}

test('un post correcto no tiene errores', async () => {
  assert.deepEqual(await crearPost('2026-11-03-linkedin-01', { 'post.md': POST_VALIDO, 'imagen-1.jpg': JPEG }), []);
});

test('detecta imagen que no es JPEG y cantidad incorrecta', async () => {
  const errores = await crearPost('2026-11-03-linkedin-01', {
    'post.md': POST_VALIDO,
    'imagen-1.jpg': PNG,
    'imagen-2.jpg': JPEG,
  });
  assert.ok(errores.some((e) => e.includes('imagen-1.jpg no es un JPEG real')));
  assert.ok(errores.some((e) => e.includes('lleva 1 imagen')));
});

test('detecta carpeta que no coincide con fecha y red', async () => {
  const errores = await crearPost('2026-11-05-instagram-01', { 'post.md': POST_VALIDO, 'imagen-1.jpg': JPEG });
  assert.ok(errores.some((e) => e.includes('no coincide con la carpeta (2026-11-05)')));
  assert.ok(errores.some((e) => e.includes('red "linkedin" no coincide')));
});

test('rechazado sin comentario, pilar desconocido y fecha sin offset de México', async () => {
  const texto = POST_VALIDO.replace('estado: por-revisar', 'estado: rechazado')
    .replace('pilar: casos-de-exito', 'pilar: memes')
    .replace('-06:00', 'Z');
  const errores = await crearPost('2026-11-03-linkedin-01', { 'post.md': texto, 'imagen-1.jpg': JPEG });
  assert.ok(errores.some((e) => e.includes('comentario_revision')));
  assert.ok(errores.some((e) => e.includes('pilar "memes"')));
  assert.ok(errores.some((e) => e.includes('fecha debe tener el formato')));
});

test('archivos no permitidos y numeración con huecos', async () => {
  const texto = POST_VALIDO.replace('formato: imagen', 'formato: carrusel');
  const errores = await crearPost('2026-11-03-linkedin-01', {
    'post.md': texto,
    'imagen-1.jpg': JPEG,
    'imagen-3.jpg': JPEG,
    'foto.png': PNG,
  });
  assert.ok(errores.some((e) => e.includes('archivos no permitidos: foto.png')));
  assert.ok(errores.some((e) => e.includes('sin huecos')));
});
