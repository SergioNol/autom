import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Slot } from './lote.ts';
import { validarPlan } from './plan.ts';

const PILARES = ['tips', 'producto'];
const SLOTS: Slot[] = [
  { carpeta: '2026-11-03-linkedin-01', red: 'linkedin', fecha: '2026-11-03T09:00:00-06:00' },
  { carpeta: '2026-11-03-instagram-01', red: 'instagram', fecha: '2026-11-03T13:00:00-06:00' },
];

const imagenIa = { fuente: 'ia', prompt: 'Fotografía editorial luminosa de una oficina pequeña ordenada, sin texto', plantilla: 'titular', textos: { titulo: 'Cierra el mes sin estrés' } };

const planValido = {
  lote: '2026-11',
  briefActualizado: true,
  posts: [
    { carpeta: '2026-11-03-linkedin-01', formato: 'imagen', pilar: 'tips', caption: 'Texto LinkedIn', altText: 'Oficina ordenada', imagenes: [imagenIa] },
    {
      carpeta: '2026-11-03-instagram-01', formato: 'carrusel', pilar: 'producto', caption: 'Texto IG #pymes', altText: 'Diapositivas',
      imagenes: [imagenIa, { fuente: 'sin-fondo', plantilla: 'texto', textos: { titulo: 'Paso 1' } }],
    },
  ],
};

test('un plan correcto no tiene errores', () => {
  assert.deepEqual(validarPlan(planValido, '2026-11', SLOTS, PILARES), []);
});

test('detecta posts que faltan, carpetas fuera del calendario, pilares y archivos inexistentes', () => {
  const plan = structuredClone(planValido);
  plan.posts[0]!.carpeta = '2026-11-04-linkedin-01';
  plan.posts[1]!.pilar = 'memes';
  plan.posts[1]!.imagenes[1] = { fuente: 'foto-real', foto: 'visual/fotos-reales/no-existe.jpg', plantilla: 'limpia' } as never;

  const errores = validarPlan(plan, '2026-11', SLOTS, PILARES);
  assert.ok(errores.some((e) => e.includes('carpeta fuera del calendario')));
  assert.ok(errores.some((e) => e.includes('falta el post del calendario 2026-11-03-linkedin-01')));
  assert.ok(errores.some((e) => e.includes('pilar "memes"')));
  assert.ok(errores.some((e) => e.includes('no existe visual/fotos-reales/no-existe.jpg')));
});

test('exige título en plantillas con texto y cantidad de imágenes por formato', () => {
  const plan = structuredClone(planValido);
  plan.posts[0]!.imagenes = [{ ...imagenIa, textos: {} } as never, imagenIa];
  const errores = validarPlan(plan, '2026-11', SLOTS, PILARES);
  assert.ok(errores.some((e) => e.includes('necesita textos.titulo')));
  assert.ok(errores.some((e) => e.includes('"imagen" lleva 1 imagen')));
});
