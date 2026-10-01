// Uso: node scripts/materializar-lote.ts AAAA-MM [--simular]
// Convierte generacion/AAAA-MM/plan.json en posts/AAAA-MM/*/post.md + imagen-N.jpg.
// Antes asigna a cada post una referencia de estilo de referencias/<red>/ (por turnos).
// --simular: no llama a OpenAI (fondos de color de marca) para probar plantillas gratis.
import { argLote, leerCalendario, leerPlanCrudo, salirConError, tieneBandera } from './lib/cli.ts';
import { leerConfig } from './lib/config.ts';
import { materializarLote } from './lib/materializar.ts';
import { planSchema, validarPlan } from './lib/plan.ts';
import { asignarReferencias, listarReferencias } from './lib/referencias.ts';
import { leerPilares } from './lib/repositorio.ts';

const lote = argLote('node scripts/materializar-lote.ts AAAA-MM [--simular]');
const slots = leerCalendario(lote);
const crudo = leerPlanCrudo(lote);

const errores = validarPlan(crudo, lote, slots, await leerPilares());
if (errores.length > 0) salirConError(`El plan no es válido; ejecuta npm run validar-plan -- ${lote}`, 1);

const plan = asignarReferencias(planSchema.parse(crudo), slots, listarReferencias());
for (const post of plan.posts) {
  const usadas = [...new Set(post.imagenes.flatMap((img) => (img.fuente === 'ia' ? img.referencias : [])))];
  console.log(`${post.carpeta}: ${usadas.length > 0 ? usadas.join(', ') : 'sin referencia'}`);
}

const resultado = await materializarLote(plan, slots, leerConfig(), tieneBandera('--simular'));
console.log(
  `${resultado.posts} posts, ${resultado.imagenesNuevas} imágenes nuevas, ${resultado.variantes.length} variantes. ` +
    `Gasto acumulado del lote: US$ ${resultado.costos.totalUsd.toFixed(2)}`,
);
