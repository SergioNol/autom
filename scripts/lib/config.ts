import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { REDES } from './post.ts';
import { RAIZ } from './repositorio.ts';

export const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'hora en formato HH:MM' });
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const formato = z.object({
  ancho: z.number().int().positive(),
  alto: z.number().int().positive(),
  tamanoGeneracion: z.string().regex(/^\d+x\d+$/),
});

const configSchema = z.object({
  zonaHoraria: z.string(),
  offset: z.string().regex(/^[+-]\d{2}:\d{2}$/),
  /** Usuario de GitHub que revisa el PR del lote. Vacío = sin revisor asignado. */
  aprobador: z.string(),
  calendario: z.record(z.enum(REDES), z.object({ dias: z.array(z.enum(DIAS)).min(1), hora })),
  imagenes: z.object({
    modelo: z.string().min(1),
    calidad: z.enum(['low', 'medium', 'high', 'xhigh', 'max', 'auto']),
    variantesPortada: z.number().int().min(1).max(2),
    precioUsdPorMillonTokens: z.object({ textoEntrada: z.number(), imagenEntrada: z.number(), imagenSalida: z.number() }),
  }),
  formatos: z.record(z.enum(REDES), formato),
  marca: z.object({
    /** false mientras los colores sean provisionales: el PR lo avisa. */
    confirmada: z.boolean(),
    /** Colores: primario = carbón (texto y fondos oscuros), secundario = fondo claro, acento = coral, texto = blanco sobre oscuro. */
    colores: z.object({ primario: color, secundario: color, acento: color, texto: color }),
    tipografia: z.string(),
    /** Logo para fondos claros (plantillas por defecto) y versión blanca para fotos (plantilla `limpia`). */
    logo: z.string(),
    logoBlanco: z.string(),
  }),
  publicacion: z.object({
    instagramGraphVersion: z.string().regex(/^v\d+\.\d+$/),
    linkedinVersion: z.string().regex(/^\d{6}$/),
    margenVencidoHoras: z.number().positive(),
    intentos: z.number().int().min(1).max(5),
  }),
});

export type Config = z.infer<typeof configSchema>;

let cache: Config | undefined;

export function leerConfig(raiz = RAIZ): Config {
  cache ??= configSchema.parse(JSON.parse(readFileSync(path.join(raiz, 'config.json'), 'utf8')));
  return cache;
}
