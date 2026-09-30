import { open, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const RAIZ = path.resolve(import.meta.dirname, '../..');
export const DIR_POSTS = path.join(RAIZ, 'posts');
export const LOTE_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface PostEnDisco {
  lote: string;
  carpeta: string;
  /** Ruta relativa a la raíz del repo, con `/`. */
  ruta: string;
  texto: string | null;
  archivos: string[];
}

async function subcarpetas(dir: string): Promise<string[]> {
  try {
    const entradas = await readdir(dir, { withFileTypes: true });
    return entradas.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

/** Lee todos los posts (o los de un lote) de `posts/AAAA-MM/<carpeta>/`. */
export async function listarPosts(lote?: string, dirPosts = DIR_POSTS): Promise<PostEnDisco[]> {
  const lotes = lote ? [lote] : await subcarpetas(dirPosts);
  const posts: PostEnDisco[] = [];

  for (const l of lotes) {
    for (const carpeta of await subcarpetas(path.join(dirPosts, l))) {
      const dir = path.join(dirPosts, l, carpeta);
      const archivos = (await readdir(dir)).sort();
      const texto = archivos.includes('post.md') ? await readFile(path.join(dir, 'post.md'), 'utf8') : null;
      posts.push({ lote: l, carpeta, ruta: path.relative(RAIZ, dir).split(path.sep).join('/'), texto, archivos });
    }
  }
  return posts;
}

/** Comprueba la firma JPEG (FF D8 FF), no solo la extensión. */
export async function esJpeg(ruta: string): Promise<boolean> {
  const archivo = await open(ruta, 'r');
  try {
    const { buffer, bytesRead } = await archivo.read(Buffer.alloc(3), 0, 3, 0);
    return bytesRead === 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  } finally {
    await archivo.close();
  }
}

/** Identificadores de pilar: primera columna de la tabla de `marca/pilares.md`, entre backticks. */
export async function leerPilares(raiz = RAIZ): Promise<string[]> {
  const texto = await readFile(path.join(raiz, 'marca', 'pilares.md'), 'utf8');
  return [...texto.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|/gm)].map((m) => m[1]!);
}
