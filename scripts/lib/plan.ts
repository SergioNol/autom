import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { Slot } from './lote.ts';
import { FORMATOS, IMAGENES_POR_FORMATO } from './post.ts';
import { RAIZ } from './repositorio.ts';
import { validarContenido } from './validacion.ts';

export const PLANTILLAS = ['titular', 'limpia', 'texto', 'feature', 'resultado'] as const;
export type Plantilla = (typeof PLANTILLAS)[number];

/** Series mensuales de visual/guia-estilo.md. La etiqueta (píldora) la pone la plantilla; la parodia no lleva. */
export const SERIES = ['feature', 'caso-real', 'resultado', 'parodia'] as const;
export type Serie = (typeof SERIES)[number];
export const ETIQUETA_SERIE: Record<Serie, string> = { feature: 'Feature', 'caso-real': 'Caso real', resultado: 'Resultado', parodia: '' };

export const MAX_PALABRAS_TITULO = 8;
const palabras = (texto: string) => texto.split(/\s+/).filter(Boolean).length;

export const dirGeneracion = (lote: string, raiz = RAIZ) => path.join(raiz, 'generacion', lote);

const textos = z
  .object({
    titulo: z.string().trim().max(70).optional(),
    subtitulo: z.string().trim().max(140).optional(),
    /** Plantilla `feature`: texto principal y secundario de la tarjeta de interfaz. */
    tarjeta: z.string().trim().max(40).optional(),
    detalle: z.string().trim().max(60).optional(),
  })
  .default({});

const comun = { plantilla: z.enum(PLANTILLAS), textos };

/**
 * Cada imagen del post:
 * - `ia`: fondo generado con el modelo de imagen (referencias opcionales: logo, fotos de marca).
 * - `foto-real`: una foto de visual/fotos-reales/ (obligatorio para equipo y cultura).
 * - `sin-fondo`: solo plantilla sobre color de marca (diapositivas de texto, coste cero).
 */
export const imagenPlanSchema = z.discriminatedUnion('fuente', [
  z.object({ fuente: z.literal('ia'), prompt: z.string().trim().min(40), referencias: z.array(z.string()).max(4).default([]), ...comun }),
  z.object({ fuente: z.literal('foto-real'), foto: z.string(), ...comun }),
  z.object({ fuente: z.literal('sin-fondo'), ...comun }),
]);
export type ImagenPlan = z.infer<typeof imagenPlanSchema>;

const postPlanSchema = z.object({
  carpeta: z.string(),
  formato: z.enum(FORMATOS),
  pilar: z.string(),
  serie: z.enum(SERIES).optional(),
  caption: z.string().trim().min(1),
  altText: z.string().trim().min(1).max(1000),
  imagenes: z.array(imagenPlanSchema).min(1).max(10),
});
export type PostPlan = z.infer<typeof postPlanSchema>;

export const planSchema = z.object({
  lote: z.string(),
  briefActualizado: z.boolean(),
  fotosSugeridas: z.array(z.string().trim().min(1)).default([]),
  notas: z.array(z.string()).default([]),
  posts: z.array(postPlanSchema),
});
export type Plan = z.infer<typeof planSchema>;

/** Valida el plan contra el calendario, los pilares y los archivos referenciados. */
export function validarPlan(datos: unknown, lote: string, slots: Slot[], pilares: string[], raiz = RAIZ): string[] {
  const parseado = planSchema.safeParse(datos);
  if (!parseado.success) return parseado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);

  const plan = parseado.data;
  const errores: string[] = [];
  if (plan.lote !== lote) errores.push(`lote debe ser "${lote}"`);

  const porCarpeta = new Map(slots.map((s) => [s.carpeta, s]));
  const vistas = new Set<string>();

  for (const post of plan.posts) {
    const pre = `posts[${post.carpeta}]`;
    const slot = porCarpeta.get(post.carpeta);
    if (!slot) {
      errores.push(`${pre}: carpeta fuera del calendario`);
      continue;
    }
    if (vistas.has(post.carpeta)) errores.push(`${pre}: carpeta repetida`);
    vistas.add(post.carpeta);

    const frontmatter = { red: slot.red, formato: post.formato, fecha: slot.fecha, pilar: post.pilar, estado: 'por-revisar', alt_text: post.altText };
    errores.push(...validarContenido(frontmatter, post.caption, pilares).map((e) => `${pre}: ${e}`));

    const { min, max } = IMAGENES_POR_FORMATO[post.formato];
    if (post.imagenes.length < min || post.imagenes.length > max) {
      errores.push(`${pre}: "${post.formato}" lleva ${min === max ? min : `${min} a ${max}`} imagen(es)`);
    }
    for (const [i, img] of post.imagenes.entries()) {
      const archivos = img.fuente === 'ia' ? img.referencias : img.fuente === 'foto-real' ? [img.foto] : [];
      for (const archivo of archivos) {
        if (!existsSync(path.join(raiz, archivo))) errores.push(`${pre}.imagenes[${i}]: no existe ${archivo}`);
      }
      if (img.fuente === 'foto-real' && !img.foto.startsWith('visual/fotos-reales/')) {
        errores.push(`${pre}.imagenes[${i}]: las fotos reales deben estar en visual/fotos-reales/`);
      }
      if (img.plantilla !== 'limpia' && !img.textos.titulo) {
        errores.push(`${pre}.imagenes[${i}]: la plantilla "${img.plantilla}" necesita textos.titulo`);
      }
      if (img.textos.titulo && palabras(img.textos.titulo) > MAX_PALABRAS_TITULO) {
        errores.push(`${pre}.imagenes[${i}]: el título tiene más de ${MAX_PALABRAS_TITULO} palabras`);
      }
      if (img.plantilla === 'feature' && !img.textos.tarjeta) {
        errores.push(`${pre}.imagenes[${i}]: la plantilla "feature" necesita textos.tarjeta`);
      }
    }
    errores.push(...validarSerie(post).map((e) => `${pre}: ${e}`));
  }

  for (const slot of slots) if (!vistas.has(slot.carpeta)) errores.push(`falta el post del calendario ${slot.carpeta}`);
  return errores;
}

/** Reglas de cada serie (visual/guia-estilo.md). */
function validarSerie(post: PostPlan): string[] {
  const errores: string[] = [];
  const plantillas = post.imagenes.map((img) => img.plantilla);
  if (post.serie !== 'feature' && plantillas.includes('feature')) errores.push('la plantilla "feature" es solo para la serie feature');
  if (post.serie !== 'resultado' && plantillas.includes('resultado')) errores.push('la plantilla "resultado" es solo para la serie resultado');

  switch (post.serie) {
    case 'feature':
      if (plantillas[0] !== 'feature') errores.push('la serie feature empieza con la plantilla "feature"');
      break;
    case 'resultado':
      if (plantillas.some((p) => p !== 'resultado')) errores.push('la serie resultado usa solo la plantilla "resultado"');
      break;
    case 'caso-real':
      if (post.imagenes.some((img) => img.fuente !== 'ia')) errores.push('la serie caso-real (simios) genera todas sus imágenes con ia');
      break;
    case 'parodia':
      if (post.imagenes[0]?.fuente !== 'ia') errores.push('la serie parodia necesita una imagen ia');
      break;
  }
  return errores;
}
