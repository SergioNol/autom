import { parseDocument } from 'yaml';

export const REDES = ['instagram', 'linkedin'] as const;
export type Red = (typeof REDES)[number];

export const FORMATOS = ['imagen', 'carrusel'] as const;
export type Formato = (typeof FORMATOS)[number];

/** En `main`, `por-revisar` significa aprobado: solo se llega a `main` por PR aprobado. */
export const ESTADOS = ['por-revisar', 'rechazado', 'publicado', 'fallido'] as const;
export type Estado = (typeof ESTADOS)[number];

export const IMAGENES_POR_FORMATO: Record<Formato, { min: number; max: number }> = {
  imagen: { min: 1, max: 1 },
  carrusel: { min: 2, max: 10 },
};

export const LIMITE_CAPTION: Record<Red, number> = { instagram: 2200, linkedin: 3000 };

export interface Frontmatter {
  red: Red;
  formato: Formato;
  /** ISO 8601 con offset de America/Mexico_City, p. ej. 2026-11-03T10:00:00-06:00 */
  fecha: string;
  pilar: string;
  estado: Estado;
  comentario_revision: string;
  alt_text: string;
  prompt_imagen: string;
  id_externo: string;
  publicado_en: string;
  error: string;
}

export interface PostParseado {
  datos: Record<string, unknown>;
  caption: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/** Separa frontmatter YAML y caption. Lanza si el archivo no tiene la forma esperada. */
export function parsearPost(texto: string): PostParseado {
  const match = FRONTMATTER.exec(texto);
  if (!match) throw new Error('post.md debe empezar con un bloque de frontmatter entre líneas ---');

  const doc = parseDocument(match[1]!);
  if (doc.errors.length > 0) throw new Error(`YAML inválido: ${doc.errors[0]!.message}`);

  const datos: unknown = doc.toJS();
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) {
    throw new Error('El frontmatter debe ser un objeto YAML');
  }
  return { datos: datos as Record<string, unknown>, caption: match[2]!.trim() };
}

const COMENTARIOS: Partial<Record<keyof Frontmatter, string>> = {
  red: 'instagram | linkedin',
  formato: 'imagen | carrusel',
  estado: 'por-revisar | rechazado | publicado | fallido',
  comentario_revision: 'si rechazas: estado: rechazado + el motivo aquí',
};

const ORDEN: (keyof Frontmatter)[] = [
  'red', 'formato', 'fecha', 'pilar', 'estado', 'comentario_revision',
  'alt_text', 'prompt_imagen', 'id_externo', 'publicado_en', 'error',
];

/** Campos con valores de vocabulario fijo: se escriben sin comillas para que sean fáciles de editar. */
const SIN_COMILLAS = new Set<keyof Frontmatter>(['red', 'formato', 'fecha', 'pilar', 'estado']);

/** Escribe un post.md nuevo con el orden de campos y comentarios del formato acordado. */
export function serializarPost(datos: Frontmatter, caption: string): string {
  const lineas = ORDEN.map((clave) => {
    // JSON es YAML válido entre comillas dobles: escapa saltos de línea y comillas.
    const valor = SIN_COMILLAS.has(clave) ? datos[clave] : JSON.stringify(datos[clave] ?? '');
    const comentario = COMENTARIOS[clave];
    return `${clave}: ${valor}${comentario ? `  # ${comentario}` : ''}`;
  });
  return `---\n${lineas.join('\n')}\n---\n${caption.trim()}\n`;
}

/**
 * Cambia campos del frontmatter conservando orden, comentarios y caption.
 * Lo usará la publicación para escribir `estado`, `id_externo`, `publicado_en` y `error`.
 */
export function actualizarFrontmatter(texto: string, cambios: Partial<Frontmatter>): string {
  const match = FRONTMATTER.exec(texto);
  if (!match) throw new Error('post.md sin frontmatter');

  const doc = parseDocument(match[1]!);
  for (const [clave, valor] of Object.entries(cambios)) doc.set(clave, valor);
  return `---\n${doc.toString().trimEnd()}\n---\n${match[2]!}`;
}
