import type { Frontmatter } from './post.ts';

export const ZONA_HORARIA = 'America/Mexico_City';

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA_HORARIA,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export interface FilaCalendario {
  ruta: string;
  datos: Pick<Frontmatter, 'fecha' | 'red' | 'formato' | 'pilar' | 'estado'>;
}

/**
 * Tabla markdown del lote para la descripción del PR.
 * `baseUrl` (p. ej. https://github.com/org/repo/blob/lote/2026-11) hace que los enlaces funcionen fuera del repo.
 */
export function tablaCalendario(filas: FilaCalendario[], baseUrl?: string): string {
  const ordenadas = [...filas].sort((a, b) => Date.parse(a.datos.fecha) - Date.parse(b.datos.fecha));
  const lineas = [
    '| Fecha (CDMX) | Red | Formato | Pilar | Estado | Post |',
    '|---|---|---|---|---|---|',
    ...ordenadas.map(({ ruta, datos }) => {
      const enlace = baseUrl ? `${baseUrl.replace(/\/$/, '')}/${ruta}/post.md` : `${ruta}/post.md`;
      const nombre = ruta.split('/').at(-1);
      return `| ${formatoFecha.format(new Date(datos.fecha))} | ${datos.red} | ${datos.formato} | ${datos.pilar} | ${datos.estado} | [${nombre}](${enlace}) |`;
    }),
  ];

  const porRed = Object.entries(Object.groupBy(ordenadas, (f) => f.datos.red))
    .map(([red, lista]) => `${red}: ${lista?.length ?? 0}`)
    .join(' · ');
  return `${lineas.join('\n')}\n\n**Total:** ${ordenadas.length} posts (${porRed || 'sin posts'})`;
}
