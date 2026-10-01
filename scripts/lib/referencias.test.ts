import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import type { Slot } from './lote.ts';
import { planSchema } from './plan.ts';
import { INSTRUCCION_REFERENCIA, asignarReferencias, listarReferencias } from './referencias.ts';

const SLOTS: Slot[] = [
  { carpeta: '2026-11-03-instagram-01', red: 'instagram', fecha: '2026-11-03T13:00:00-06:00' },
  { carpeta: '2026-11-05-instagram-01', red: 'instagram', fecha: '2026-11-05T13:00:00-06:00' },
  { carpeta: '2026-11-10-instagram-01', red: 'instagram', fecha: '2026-11-10T13:00:00-06:00' },
  { carpeta: '2026-11-03-linkedin-01', red: 'linkedin', fecha: '2026-11-03T09:00:00-06:00' },
];
const ia = { fuente: 'ia', prompt: 'Bright premium photograph of a tidy desk, no text', plantilla: 'titular', textos: { titulo: 'Hola' } };
const post = (carpeta: string, extra: object = {}) => ({ carpeta, formato: 'imagen', pilar: 'tips', caption: 'x', altText: 'y', imagenes: [ia], ...extra });
const DISPONIBLES = { instagram: ['referencias/instagram/a.jpg', 'referencias/instagram/b.jpg'], linkedin: ['referencias/linkedin/c.jpg'] };

const refs = (plan: ReturnType<typeof asignarReferencias>) => Object.fromEntries(plan.posts.map((p) => [p.carpeta, p.imagenes.map((i) => (i.fuente === 'ia' ? i.referencias : []))]));

test('reparte las referencias de cada red por turnos y añade la instrucción al prompt', () => {
  const plan = planSchema.parse({ lote: '2026-11', briefActualizado: true, posts: SLOTS.map((s) => post(s.carpeta)) });
  const r = refs(asignarReferencias(plan, SLOTS, DISPONIBLES));
  const ig = ['2026-11-03-instagram-01', '2026-11-05-instagram-01', '2026-11-10-instagram-01'].map((c) => r[c]![0]![0]);
  assert.notEqual(ig[0], ig[1]); // posts consecutivos, referencias distintas
  assert.equal(ig[0], ig[2]); // con 2 referencias, la tercera vuelve a la primera
  assert.deepEqual(r['2026-11-03-linkedin-01'], [['referencias/linkedin/c.jpg']]);
  const img = asignarReferencias(plan, SLOTS, DISPONIBLES).posts[0]!.imagenes[0]!;
  assert.ok(img.fuente === 'ia' && img.prompt.endsWith(INSTRUCCION_REFERENCIA));
});

test('cada lote empieza en una referencia distinta', () => {
  const de = (lote: string) => {
    const slots = SLOTS.map((s) => ({ ...s, carpeta: s.carpeta.replace('2026-11', lote) }));
    const plan = planSchema.parse({ lote, briefActualizado: true, posts: slots.map((s) => post(s.carpeta)) });
    return asignarReferencias(plan, slots, DISPONIBLES).posts[0]!.imagenes[0]!;
  };
  assert.notDeepEqual((de('2026-11') as { referencias: string[] }).referencias, (de('2026-12') as { referencias: string[] }).referencias);
});

test('respeta referencias explícitas, no toca caso-real y comparte referencia en el carrusel', () => {
  const plan = planSchema.parse({
    lote: '2026-11', briefActualizado: true,
    posts: [
      post('2026-11-03-instagram-01', { imagenes: [{ ...ia, referencias: ['visual/personajes/chela.jpg'] }] }),
      post('2026-11-05-instagram-01', { serie: 'caso-real', formato: 'carrusel', imagenes: [ia, ia] }),
      post('2026-11-10-instagram-01', { formato: 'carrusel', imagenes: [ia, { fuente: 'sin-fondo', plantilla: 'texto', textos: { titulo: 'Paso' } }, ia] }),
    ],
  });
  const r = refs(asignarReferencias(plan, SLOTS, DISPONIBLES));
  assert.deepEqual(r['2026-11-03-instagram-01'], [['visual/personajes/chela.jpg']]);
  assert.deepEqual(r['2026-11-05-instagram-01'], [[], []]);
  const [primera, , tercera] = r['2026-11-10-instagram-01']!;
  assert.equal(primera!.length, 1);
  assert.deepEqual(primera, tercera);
});

test('lista solo imágenes de cada carpeta, ordenadas', () => {
  const raiz = mkdtempSync(path.join(tmpdir(), 'refs-'));
  mkdirSync(path.join(raiz, 'referencias', 'instagram'), { recursive: true });
  for (const f of ['b.png', 'a.JPG', 'a.md', '.gitkeep']) writeFileSync(path.join(raiz, 'referencias', 'instagram', f), '');
  assert.deepEqual(listarReferencias(raiz), { instagram: ['referencias/instagram/a.JPG', 'referencias/instagram/b.png'], linkedin: [] });
});
