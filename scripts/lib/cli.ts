import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Slot } from './lote.ts';
import { dirGeneracion } from './plan.ts';
import { LOTE_REGEX } from './repositorio.ts';

export function salirConError(mensaje: string, codigo = 2): never {
  console.error(mensaje);
  process.exit(codigo);
}

export const tieneBandera = (bandera: string) => process.argv.includes(bandera);

/** Primer argumento posicional como lote AAAA-MM (obligatorio salvo que se indique). */
export function argLote(uso: string): string {
  const lote = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!lote || !LOTE_REGEX.test(lote)) salirConError(`Uso: ${uso}`);
  return lote;
}

export function leerJson(ruta: string): unknown {
  if (!existsSync(ruta)) salirConError(`No existe ${ruta}`);
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

export const leerCalendario = (lote: string) =>
  (leerJson(path.join(dirGeneracion(lote), 'calendario.json')) as { slots: Slot[] }).slots;

export const leerPlanCrudo = (lote: string) => leerJson(path.join(dirGeneracion(lote), 'plan.json'));
