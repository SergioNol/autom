// Uso: node scripts/validar-plan.ts AAAA-MM
// Comprueba generacion/AAAA-MM/plan.json contra el calendario, los pilares y los archivos referenciados.
import { argLote, leerCalendario, leerPlanCrudo } from './lib/cli.ts';
import { validarPlan } from './lib/plan.ts';
import { leerPilares } from './lib/repositorio.ts';

const lote = argLote('node scripts/validar-plan.ts AAAA-MM');
const errores = validarPlan(leerPlanCrudo(lote), lote, leerCalendario(lote), await leerPilares());

if (errores.length > 0) {
  console.error(`plan.json de ${lote} tiene ${errores.length} error(es):`);
  for (const e of errores) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`plan.json de ${lote} es válido.`);
