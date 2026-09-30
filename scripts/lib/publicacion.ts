import type { Frontmatter } from './post.ts';

export type Decision = 'publicar' | 'esperar' | 'vencido' | 'ignorar';

/**
 * Qué hacer con un post de `main` en una corrida de publicación.
 * Solo `por-revisar` es publicable (en `main` significa aprobado); `rechazado`, `publicado` y `fallido` se ignoran.
 * Si lleva más de `margenVencidoHoras` de retraso (p. ej. PR aprobado tarde), no se publica: queda para reprogramar.
 */
export function decidirPublicacion(
  datos: Pick<Frontmatter, 'estado' | 'fecha'>,
  ahora: Date,
  margenVencidoHoras = 24,
): Decision {
  if (datos.estado !== 'por-revisar') return 'ignorar';
  const fecha = Date.parse(datos.fecha);
  if (Number.isNaN(fecha)) return 'ignorar';
  if (fecha > ahora.getTime()) return 'esperar';
  if (ahora.getTime() - fecha > margenVencidoHoras * 3_600_000) return 'vencido';
  return 'publicar';
}
