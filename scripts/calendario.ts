// Uso: node scripts/calendario.ts AAAA-MM [rama]
// Imprime la tabla del lote para la descripción del PR. En Actions usa GITHUB_REPOSITORY para enlaces absolutos.
import { tablaCalendario, type FilaCalendario } from './lib/calendario.ts';
import { parsearPost, type Frontmatter } from './lib/post.ts';
import { LOTE_REGEX, listarPosts } from './lib/repositorio.ts';

const [lote, rama = lote ? `lote/${lote}` : undefined] = process.argv.slice(2);
if (!lote || !LOTE_REGEX.test(lote)) {
  console.error('Uso: node scripts/calendario.ts AAAA-MM [rama]');
  process.exit(2);
}

const filas: FilaCalendario[] = [];
for (const post of await listarPosts(lote)) {
  if (post.texto === null) continue;
  try {
    filas.push({ ruta: post.ruta, datos: parsearPost(post.texto).datos as unknown as Frontmatter });
  } catch (error) {
    console.error(`Omitido ${post.ruta}: ${(error as Error).message}`);
  }
}

const repo = process.env.GITHUB_REPOSITORY;
console.log(tablaCalendario(filas, repo ? `https://github.com/${repo}/blob/${rama}` : undefined));
