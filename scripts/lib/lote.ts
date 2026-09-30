import { DIAS, type Config } from './config.ts';
import { REDES, type Red } from './post.ts';

export interface Slot {
  carpeta: string;
  red: Red;
  /** ISO con offset local, p. ej. 2026-11-03T09:00:00-06:00 */
  fecha: string;
}

/** Mes siguiente al día actual en la zona horaria dada. */
export function loteSiguiente(ahora: Date, zonaHoraria: string): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: zonaHoraria, year: 'numeric', month: '2-digit' }).formatToParts(ahora);
  const anio = Number(partes.find((p) => p.type === 'year')!.value);
  const mes = Number(partes.find((p) => p.type === 'month')!.value);
  return mes === 12 ? `${anio + 1}-01` : `${anio}-${String(mes + 1).padStart(2, '0')}`;
}

export function lotePrevio(lote: string): string {
  const [anio, mes] = lote.split('-').map(Number) as [number, number];
  return mes === 1 ? `${anio - 1}-12` : `${anio}-${String(mes - 1).padStart(2, '0')}`;
}

/** Calendario determinista del lote a partir de `config.calendario` (días y hora por red). */
export function slotsDelLote(lote: string, config: Pick<Config, 'calendario' | 'offset'>): Slot[] {
  const [anio, mes] = lote.split('-').map(Number) as [number, number];
  const diasDelMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const slots: Slot[] = [];

  for (let dia = 1; dia <= diasDelMes; dia++) {
    const nombreDia = DIAS[new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()]!;
    const fechaCorta = `${lote}-${String(dia).padStart(2, '0')}`;
    for (const red of REDES) {
      const regla = config.calendario[red];
      if (!regla?.dias.includes(nombreDia)) continue;
      slots.push({ carpeta: `${fechaCorta}-${red}-01`, red, fecha: `${fechaCorta}T${regla.hora}:00${config.offset}` });
    }
  }
  return slots.sort((a, b) => a.fecha.localeCompare(b.fecha)); // mismo offset: orden de texto = orden cronológico
}
