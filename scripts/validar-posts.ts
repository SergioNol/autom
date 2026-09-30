// Uso: node scripts/validar-posts.ts [AAAA-MM]
import { DIR_POSTS, LOTE_REGEX, leerPilares, listarPosts } from './lib/repositorio.ts';
import { validarPost } from './lib/validacion.ts';

const lote = process.argv[2];
if (lote && !LOTE_REGEX.test(lote)) {
  console.error(`Lote inválido "${lote}". Usa AAAA-MM.`);
  process.exit(2);
}

const pilares = await leerPilares();
if (pilares.length === 0) {
  console.error('marca/pilares.md no define identificadores de pilar (primera columna de la tabla, entre backticks).');
  process.exit(2);
}

const posts = await listarPosts(lote);
let conErrores = 0;

for (const post of posts) {
  const errores = await validarPost(post, DIR_POSTS, pilares);
  if (errores.length === 0) continue;
  conErrores++;
  console.error(`✗ ${post.ruta}`);
  for (const error of errores) console.error(`    - ${error}`);
}

console.log(`${posts.length} posts revisados, ${conErrores} con errores.`);
process.exitCode = conErrores > 0 ? 1 : 0;
