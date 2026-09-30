import assert from 'node:assert/strict';
import { test } from 'node:test';
import { POST_VALIDO } from './fixtures.test-data.ts';
import { actualizarFrontmatter, parsearPost } from './post.ts';

test('parsea frontmatter y caption; la fecha queda como texto', () => {
  const { datos, caption } = parsearPost(POST_VALIDO);
  assert.equal(datos.red, 'linkedin');
  assert.equal(datos.fecha, '2026-11-03T10:00:00-06:00');
  assert.equal(caption, 'Primera línea del caption.\n\nSegunda línea.');
});

test('rechaza archivos sin frontmatter o con YAML roto', () => {
  assert.throws(() => parsearPost('solo texto'), /frontmatter/);
  assert.throws(() => parsearPost('---\nred: [\n---\ncaption'), /YAML inválido/);
});

test('actualizarFrontmatter cambia campos y conserva comentarios y caption', () => {
  const nuevo = actualizarFrontmatter(POST_VALIDO, { estado: 'publicado', id_externo: '123' });
  const { datos, caption } = parsearPost(nuevo);
  assert.equal(datos.estado, 'publicado');
  assert.equal(datos.id_externo, '123');
  assert.equal(datos.fecha, '2026-11-03T10:00:00-06:00');
  assert.match(nuevo, /# instagram \| linkedin/);
  assert.equal(caption, 'Primera línea del caption.\n\nSegunda línea.');
});
