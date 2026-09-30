import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aLittleText } from './linkedin-texto.ts';

test('escapa caracteres reservados y convierte hashtags', () => {
  assert.equal(
    aLittleText('Ahorra (mucho) tiempo @equipo *hoy* #ERP #pymes_mx'),
    'Ahorra \\(mucho\\) tiempo \\@equipo \\*hoy\\* {hashtag|\\#|ERP} {hashtag|\\#|pymes\\_mx}',
  );
});

test('texto sin caracteres especiales queda igual, con saltos de línea y acentos', () => {
  assert.equal(aLittleText('Hola, ¿cómo va?\n\nListo.'), 'Hola, ¿cómo va?\n\nListo.');
});
