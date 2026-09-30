import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Config } from './config.ts';
import { lotePrevio, loteSiguiente, slotsDelLote } from './lote.ts';

const config: Pick<Config, 'calendario' | 'offset'> = {
  offset: '-06:00',
  calendario: {
    linkedin: { dias: ['martes', 'jueves'], hora: '09:00' },
    instagram: { dias: ['martes', 'jueves'], hora: '13:00' },
  },
};

test('lote siguiente usa la fecha de CDMX, incluido el cambio de año', () => {
  assert.equal(loteSiguiente(new Date('2026-09-20T15:00:00Z'), 'America/Mexico_City'), '2026-10');
  assert.equal(loteSiguiente(new Date('2026-12-20T15:00:00Z'), 'America/Mexico_City'), '2027-01');
  // 1 de octubre 03:00 UTC sigue siendo 30 de septiembre en CDMX
  assert.equal(loteSiguiente(new Date('2026-10-01T03:00:00Z'), 'America/Mexico_City'), '2026-10');
  assert.equal(lotePrevio('2027-01'), '2026-12');
});

test('noviembre 2026: 4 martes y 4 jueves por red, con fecha y carpeta coherentes', () => {
  const slots = slotsDelLote('2026-11', config);
  assert.equal(slots.length, 16);
  assert.deepEqual(slots[0], { carpeta: '2026-11-03-linkedin-01', red: 'linkedin', fecha: '2026-11-03T09:00:00-06:00' });
  assert.deepEqual(slots[1], { carpeta: '2026-11-03-instagram-01', red: 'instagram', fecha: '2026-11-03T13:00:00-06:00' });
  assert.ok(slots.every((s) => s.fecha.startsWith(s.carpeta.slice(0, 10))));
});
