import path from 'node:path';
import {
  ESTADOS,
  FORMATOS,
  IMAGENES_POR_FORMATO,
  LIMITE_CAPTION,
  REDES,
  parsearPost,
  type Frontmatter,
} from './post.ts';
import { esJpeg, type PostEnDisco } from './repositorio.ts';

const CAMPOS_TEXTO = ['comentario_revision', 'alt_text', 'prompt_imagen', 'id_externo', 'publicado_en', 'error'] as const;
const CARPETA_REGEX = /^(\d{4}-\d{2}-\d{2})-(instagram|linkedin)-(\d{2})$/;
/** Hora local de México con offset explícito (UTC-6, sin horario de verano). */
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?-06:00$/;
const IMAGEN_REGEX = /^imagen-(\d+)\.jpg$/;
const MAX_HASHTAGS_INSTAGRAM = 30;

const incluye = (lista: readonly string[], valor: unknown) => typeof valor === 'string' && lista.includes(valor);

/** Valida el frontmatter y el caption. Devuelve la lista de errores (vacía si es válido). */
export function validarContenido(datos: Record<string, unknown>, caption: string, pilares: string[]): string[] {
  const errores: string[] = [];
  const d = datos as Partial<Record<keyof Frontmatter, unknown>>;

  if (!incluye(REDES, d.red)) errores.push(`red debe ser ${REDES.join(' | ')}`);
  if (!incluye(FORMATOS, d.formato)) errores.push(`formato debe ser ${FORMATOS.join(' | ')}`);
  if (!incluye(ESTADOS, d.estado)) errores.push(`estado debe ser ${ESTADOS.join(' | ')}`);
  if (typeof d.fecha !== 'string' || !FECHA_REGEX.test(d.fecha) || Number.isNaN(Date.parse(d.fecha))) {
    errores.push('fecha debe tener el formato 2026-11-03T10:00:00-06:00 (entre comillas o sin ellas)');
  }
  if (!incluye(pilares, d.pilar)) errores.push(`pilar "${String(d.pilar)}" no existe en marca/pilares.md`);

  for (const campo of CAMPOS_TEXTO) {
    if (d[campo] !== undefined && d[campo] !== null && typeof d[campo] !== 'string') {
      errores.push(`${campo} debe ser texto`);
    }
  }
  if (!d.alt_text) errores.push('alt_text es obligatorio');
  if (d.estado === 'rechazado' && !d.comentario_revision) {
    errores.push('un post rechazado necesita comentario_revision (es la señal para el aprendizaje)');
  }

  if (!caption) errores.push('falta el caption (cuerpo de post.md)');
  const hashtags = caption.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0;
  if (d.red === 'instagram' && hashtags > MAX_HASHTAGS_INSTAGRAM) {
    errores.push(`Instagram admite como máximo ${MAX_HASHTAGS_INSTAGRAM} hashtags (hay ${hashtags})`);
  }
  if (incluye(REDES, d.red) && caption.length > LIMITE_CAPTION[d.red as Frontmatter['red']]) {
    errores.push(`caption de ${String(d.red)} supera ${LIMITE_CAPTION[d.red as Frontmatter['red']]} caracteres`);
  }
  return errores;
}

/** Imágenes `imagen-1.jpg … imagen-N.jpg`, consecutivas, en JPEG real y en la cantidad del formato. */
async function validarImagenes(post: PostEnDisco, dir: string, formato: unknown): Promise<string[]> {
  const errores: string[] = [];
  const extras = post.archivos.filter((a) => a !== 'post.md' && !IMAGEN_REGEX.test(a));
  if (extras.length > 0) errores.push(`archivos no permitidos: ${extras.join(', ')} (usa imagen-N.jpg)`);

  const numeros = post.archivos.flatMap((a) => IMAGEN_REGEX.exec(a)?.[1] ?? []).map(Number).sort((a, b) => a - b);
  if (numeros.some((n, i) => n !== i + 1)) errores.push('las imágenes deben numerarse imagen-1.jpg, imagen-2.jpg… sin huecos');

  if (incluye(FORMATOS, formato)) {
    const { min, max } = IMAGENES_POR_FORMATO[formato as Frontmatter['formato']];
    if (numeros.length < min || numeros.length > max) {
      errores.push(`un post "${String(formato)}" lleva ${min === max ? min : `de ${min} a ${max}`} imagen(es); tiene ${numeros.length}`);
    }
  }

  for (const n of numeros) {
    if (!(await esJpeg(path.join(dir, `imagen-${n}.jpg`)))) errores.push(`imagen-${n}.jpg no es un JPEG real`);
  }
  return errores;
}

/** Valida un post completo en disco: nombre de carpeta, post.md e imágenes. */
export async function validarPost(post: PostEnDisco, dirPosts: string, pilares: string[]): Promise<string[]> {
  const errores: string[] = [];
  const carpeta = CARPETA_REGEX.exec(post.carpeta);
  if (!carpeta) errores.push('la carpeta debe llamarse AAAA-MM-DD-red-NN');
  if (carpeta && !carpeta[1]!.startsWith(post.lote)) errores.push(`la fecha de la carpeta no pertenece al lote ${post.lote}`);

  if (post.texto === null) return [...errores, 'falta post.md'];

  let datos: Record<string, unknown> = {};
  try {
    const parseado = parsearPost(post.texto);
    datos = parseado.datos;
    errores.push(...validarContenido(datos, parseado.caption, pilares));
  } catch (error) {
    errores.push((error as Error).message);
  }

  if (carpeta && typeof datos.fecha === 'string' && !datos.fecha.startsWith(carpeta[1]!)) {
    errores.push(`la fecha ${datos.fecha} no coincide con la carpeta (${carpeta[1]})`);
  }
  if (carpeta && datos.red !== undefined && datos.red !== carpeta[2]) {
    errores.push(`red "${String(datos.red)}" no coincide con la carpeta (${carpeta[2]})`);
  }

  errores.push(...(await validarImagenes(post, path.join(dirPosts, post.lote, post.carpeta), datos.formato)));
  return errores;
}
