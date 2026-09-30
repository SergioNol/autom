// Uso: node scripts/preparar-lote.ts [AAAA-MM]
// Calcula el calendario del lote (por defecto, el mes siguiente) y lo guarda en generacion/AAAA-MM/calendario.json.
// Imprime `lote=…` y `previo=…` por stdout (formato de $GITHUB_OUTPUT).
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { salirConError } from './lib/cli.ts';
import { leerConfig } from './lib/config.ts';
import { lotePrevio, loteSiguiente, slotsDelLote } from './lib/lote.ts';
import { dirGeneracion } from './lib/plan.ts';
import { LOTE_REGEX } from './lib/repositorio.ts';

const config = leerConfig();
const lote = process.argv[2] || loteSiguiente(new Date(), config.zonaHoraria);
if (!LOTE_REGEX.test(lote)) salirConError(`Lote inválido "${lote}". Usa AAAA-MM.`);

const slots = slotsDelLote(lote, config);
const dir = dirGeneracion(lote);
await mkdir(dir, { recursive: true });
await writeFile(path.join(dir, 'calendario.json'), `${JSON.stringify({ lote, slots }, null, 2)}\n`);

console.error(`Calendario ${lote}: ${slots.length} posts → ${path.relative(process.cwd(), dir)}/calendario.json`);
console.log(`lote=${lote}\nprevio=${lotePrevio(lote)}`);
