// Uso: node scripts/descripcion-pr.ts AAAA-MM
// Imprime la descripción del Pull Request del lote. En Actions, GITHUB_REPOSITORY da enlaces absolutos.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { avisosDelLote } from './lib/avisos.ts';
import { tablaCalendario, type FilaCalendario } from './lib/calendario.ts';
import { argLote, leerPlanCrudo } from './lib/cli.ts';
import { leerConfig } from './lib/config.ts';
import type { Costos } from './lib/materializar.ts';
import { dirGeneracion, planSchema } from './lib/plan.ts';
import { parsearPost, type Frontmatter } from './lib/post.ts';
import { RAIZ, listarPosts } from './lib/repositorio.ts';

const lote = argLote('node scripts/descripcion-pr.ts AAAA-MM');
const config = leerConfig();
const plan = planSchema.parse(leerPlanCrudo(lote));
const dir = dirGeneracion(lote);
const repo = process.env.GITHUB_REPOSITORY;
const base = repo ? `https://github.com/${repo}/blob/lote/${lote}` : undefined;
const enlace = (ruta: string) => (base ? `${base}/${ruta}` : ruta);

const filas: FilaCalendario[] = (await listarPosts(lote)).flatMap((p) =>
  p.texto ? [{ ruta: p.ruta, datos: parsearPost(p.texto).datos as unknown as Frontmatter }] : [],
);

const avisos = [...avisosDelLote(lote, config), ...(plan.briefActualizado ? [] : ['Claude indica que el brief no correspondía al mes.']), ...plan.notas];
const aprendizaje = existsSync(path.join(dir, 'aprendizaje.md')) ? readFileSync(path.join(dir, 'aprendizaje.md'), 'utf8').trim() : '_Primer lote: sin aprendizaje previo._';
const costos: Costos = existsSync(path.join(dir, 'costos.json')) ? JSON.parse(readFileSync(path.join(dir, 'costos.json'), 'utf8')) : { totalUsd: 0, detalle: [] };
const dirVariantes = path.join(dir, 'variantes');
const variantes = existsSync(dirVariantes)
  ? readdirSync(dirVariantes, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.jpg')).sort()
  : [];
const rutaRelativa = (f: string) => path.relative(RAIZ, path.join(dirVariantes, f)).split(path.sep).join('/');

const secciones = [
  `# Contenido ${lote}`,
  avisos.length > 0 ? `## ⚠️ Avisos\n\n${avisos.map((a) => `- ${a}`).join('\n')}` : '',
  `## Cómo revisar

- **Aprobar:** no tocar el post.
- **Editar:** cambia el caption o los campos de \`post.md\` desde la pestaña *Files changed* (⋯ → *Edit file*). Para cambiar una imagen, sube otra con el **mismo nombre** (\`imagen-N.jpg\`, en JPEG).
- **Rechazar:** \`estado: rechazado\` y el motivo en \`comentario_revision\`. No borres la carpeta: el motivo alimenta el aprendizaje.
- **Terminar:** haz merge. Lo aprobado se publica solo en su fecha y hora.`,
  `## Calendario\n\n${tablaCalendario(filas, base)}`,
  `## Aprendizaje del mes anterior\n\n${aprendizaje}`,
  plan.fotosSugeridas.length > 0
    ? `## Fotos sugeridas para \`visual/fotos-reales/\`\n\n${plan.fotosSugeridas.map((f) => `- [ ] ${f}`).join('\n')}`
    : '',
  variantes.length > 0
    ? `## Variantes alternativas de portada\n\nSi prefieres una, súbela en lugar de \`imagen-1.jpg\` del post.\n\n${variantes.map((f) => `- [${f}](${enlace(rutaRelativa(f))})`).join('\n')}`
    : '',
  `## Gasto de imágenes\n\nUS$ ${costos.totalUsd.toFixed(2)} (${config.imagenes.modelo}, calidad \`${config.imagenes.calidad}\`, ${costos.detalle.length} llamadas).`,
];

console.log(secciones.filter(Boolean).join('\n\n'));
