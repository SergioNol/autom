import { readdirSync } from 'node:fs';
import path from 'node:path';
import type { Slot } from './lote.ts';
import type { Plan } from './plan.ts';
import { REDES, type Red } from './post.ts';
import { RAIZ } from './repositorio.ts';

const EXTENSIONES = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Se añade al prompt cuando la imagen lleva una referencia de estilo asignada automáticamente.
 * La referencia aporta dirección de arte; la paleta siempre es la de la guía (las referencias pueden ser de otras marcas).
 */
export const INSTRUCCION_REFERENCIA =
  'Use the reference image only as a guide for composition, framing, lighting quality and overall art direction; ' +
  'keep the color palette described in this prompt. Create a new scene; do not copy its text, logos, products, ' +
  'interface elements or people.';

/** Imágenes de `referencias/<red>/`, ordenadas por nombre, como rutas relativas al repo. */
export function listarReferencias(raiz = RAIZ): Record<Red, string[]> {
  const leer = (red: Red) => {
    try {
      return readdirSync(path.join(raiz, 'referencias', red))
        .filter((f) => EXTENSIONES.has(path.extname(f).toLowerCase()))
        .sort()
        .map((f) => `referencias/${red}/${f}`);
    } catch {
      return [];
    }
  };
  return Object.fromEntries(REDES.map((red) => [red, leer(red)])) as Record<Red, string[]>;
}

/**
 * Asigna a cada post una referencia de estilo de su red, por turnos y en orden de calendario,
 * para que no se repita siempre la misma. Cada lote empieza en una posición distinta.
 * - Todas las imágenes `ia` del post comparten referencia (carrusel coherente).
 * - No toca imágenes con `referencias` explícitas ni la serie `caso-real` (usa visual/personajes/).
 */
export function asignarReferencias(plan: Plan, slots: Slot[], disponibles: Record<Red, string[]>): Plan {
  const [anio, mes] = plan.lote.split('-').map(Number) as [number, number];
  const slotPorCarpeta = new Map(slots.map((s) => [s.carpeta, s]));
  const orden = [...plan.posts].sort((a, b) => (slotPorCarpeta.get(a.carpeta)?.fecha ?? '').localeCompare(slotPorCarpeta.get(b.carpeta)?.fecha ?? ''));
  const turno: Record<Red, number> = { instagram: 0, linkedin: 0 };
  const asignada = new Map<string, string>();

  for (const post of orden) {
    const red = slotPorCarpeta.get(post.carpeta)?.red;
    const lista = red ? disponibles[red] : [];
    const aplica = post.serie !== 'caso-real' && post.imagenes.some((img) => img.fuente === 'ia' && img.referencias.length === 0);
    if (!red || lista.length === 0 || !aplica) continue;
    asignada.set(post.carpeta, lista[(anio * 12 + mes + turno[red]++) % lista.length]!);
  }

  return {
    ...plan,
    posts: plan.posts.map((post) => {
      const ref = asignada.get(post.carpeta);
      if (!ref) return post;
      return {
        ...post,
        imagenes: post.imagenes.map((img) =>
          img.fuente === 'ia' && img.referencias.length === 0
            ? { ...img, referencias: [ref], prompt: img.prompt.includes(INSTRUCCION_REFERENCIA) ? img.prompt : `${img.prompt} ${INSTRUCCION_REFERENCIA}` }
            : img,
        ),
      };
    }),
  };
}
