import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decidirPublicacion } from './publicacion.ts';

const ahora = new Date('2026-11-03T16:30:00Z'); // 10:30 en CDMX

test('publica lo aprobado cuya hora ya llegó', () => {
  assert.equal(decidirPublicacion({ estado: 'por-revisar', fecha: '2026-11-03T10:00:00-06:00' }, ahora), 'publicar');
});

test('espera si la fecha es futura', () => {
  assert.equal(decidirPublicacion({ estado: 'por-revisar', fecha: '2026-11-03T11:00:00-06:00' }, ahora), 'esperar');
});

test('más de 24 h tarde: vencido, no se publica', () => {
  assert.equal(decidirPublicacion({ estado: 'por-revisar', fecha: '2026-11-01T10:00:00-06:00' }, ahora), 'vencido');
});

test('nunca publica rechazados, publicados ni fallidos', () => {
  for (const estado of ['rechazado', 'publicado', 'fallido'] as const) {
    assert.equal(decidirPublicacion({ estado, fecha: '2026-11-03T10:00:00-06:00' }, ahora), 'ignorar');
  }
});
