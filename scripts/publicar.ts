// Uso: node scripts/publicar.ts [--simular] [--commit]
// Publica los posts aprobados de main cuya fecha ya llegó. --commit: commitea y hace push de cada cambio de estado.
import { salirConError, tieneBandera } from './lib/cli.ts';
import { leerConfig } from './lib/config.ts';
import { publicarPendientes } from './lib/publicar.ts';

const repositorio = process.env.GITHUB_REPOSITORY;
if (!repositorio) salirConError('Falta GITHUB_REPOSITORY (owner/repo) para construir las URLs públicas de las imágenes.');

const resumen = await publicarPendientes({
  ahora: new Date(),
  config: leerConfig(),
  repositorio,
  simular: tieneBandera('--simular'),
  commit: tieneBandera('--commit'),
});

console.log(`Publicados: ${resumen.publicados.length} · Fallidos: ${resumen.fallidos.length} · Programados a futuro: ${resumen.pendientes}`);
// Salir con error hace que GitHub envíe el correo de Action fallida.
if (resumen.fallidos.length > 0) process.exitCode = 1;
