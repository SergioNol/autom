import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Config } from './config.ts';
import { RAIZ } from './repositorio.ts';

const ARCHIVOS_MARCA = ['marca/voz.md', 'marca/pilares.md', 'marca/audiencia.md', 'visual/guia-estilo.md'];

/** Mes declarado en brief-del-mes.md (línea "**Mes:** AAAA-MM"). */
export function mesDelBrief(raiz = RAIZ): string | null {
  const texto = readFileSync(path.join(raiz, 'brief-del-mes.md'), 'utf8');
  return /\*\*Mes:\*\*\s*(\d{4}-\d{2})/.exec(texto)?.[1] ?? null;
}

/** Problemas que el aprobador debe conocer antes de revisar el lote. */
export function avisosDelLote(lote: string, config: Config, raiz = RAIZ): string[] {
  const avisos: string[] = [];

  const mes = mesDelBrief(raiz);
  if (mes !== lote) {
    avisos.push(`\`brief-del-mes.md\` no está actualizado para ${lote} (dice ${mes ?? 'AAAA-MM'}): el contenido puede ser genérico.`);
  }
  if (!config.marca.confirmada) {
    avisos.push('Los colores de marca de `config.json` son provisionales (`marca.confirmada: false`).');
  }
  if (!existsSync(path.join(raiz, config.marca.logo))) {
    avisos.push(`No hay logo en \`${config.marca.logo}\`: las imágenes salen sin logo.`);
  }
  const pendientes = ARCHIVOS_MARCA.filter((f) => /PENDIENTE|<!--/.test(readFileSync(path.join(raiz, f), 'utf8')));
  if (pendientes.length > 0) {
    avisos.push(`Guías de marca con apartados por completar: ${pendientes.map((f) => `\`${f}\``).join(', ')}.`);
  }
  return avisos;
}
