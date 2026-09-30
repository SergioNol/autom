import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tablaCalendario } from './calendario.ts';

test('ordena por fecha, muestra hora de CDMX y enlaza cada post', () => {
  const tabla = tablaCalendario(
    [
      { ruta: 'posts/2026-11/2026-11-05-instagram-01', datos: { fecha: '2026-11-05T10:00:00-06:00', red: 'instagram', formato: 'carrusel', pilar: 'tips', estado: 'por-revisar' } },
      { ruta: 'posts/2026-11/2026-11-03-linkedin-01', datos: { fecha: '2026-11-03T10:00:00-06:00', red: 'linkedin', formato: 'imagen', pilar: 'producto', estado: 'por-revisar' } },
    ],
    'https://github.com/apes/contenido/blob/lote/2026-11',
  );

  const filas = tabla.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Fecha'));
  assert.match(filas[0]!, /linkedin/);
  assert.match(filas[0]!, /10:00/);
  assert.match(filas[0]!, /\(https:\/\/github\.com\/apes\/contenido\/blob\/lote\/2026-11\/posts\/2026-11\/2026-11-03-linkedin-01\/post\.md\)/);
  assert.match(tabla, /\*\*Total:\*\* 2 posts \(linkedin: 1 · instagram: 1\)/);
});
