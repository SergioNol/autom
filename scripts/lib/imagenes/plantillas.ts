import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Browser } from 'playwright';
import type { Config } from '../config.ts';
import type { Plantilla } from '../plan.ts';

export interface DatosPlantilla {
  plantilla: Plantilla;
  /** Imagen de fondo (IA o foto real). Sin fondo, se usa el color de marca. */
  fondo: Buffer | null;
  logo: Buffer | null;
  /** Píldora de la serie ("Feature", "Caso real"…). Vacía = sin etiqueta. */
  etiqueta: string;
  titulo?: string;
  subtitulo?: string;
  tarjeta?: string;
  detalle?: string;
  ancho: number;
  alto: number;
  marca: Config['marca'];
}

const escaparHtml = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const dataUrl = (datos: Buffer) => {
  const esPng = datos[0] === 0x89 && datos[1] === 0x50;
  return `data:image/${esPng ? 'png' : 'jpeg'};base64,${datos.toString('base64')}`;
};

/** Sustituye {{variables}} en la plantilla HTML. Los textos se escapan; las imágenes van inline. */
export function rellenarPlantilla(html: string, datos: DatosPlantilla): string {
  const valores: Record<string, string> = {
    ancho: String(datos.ancho),
    alto: String(datos.alto),
    tipografia: escaparHtml(datos.marca.tipografia),
    color_primario: datos.marca.colores.primario,
    color_secundario: datos.marca.colores.secundario,
    color_acento: datos.marca.colores.acento,
    color_texto: datos.marca.colores.texto,
    titulo: escaparHtml(datos.titulo ?? ''),
    subtitulo: escaparHtml(datos.subtitulo ?? ''),
    tarjeta: escaparHtml(datos.tarjeta ?? ''),
    detalle: escaparHtml(datos.detalle ?? ''),
    etiqueta: escaparHtml(datos.etiqueta),
    fondo: datos.fondo ? dataUrl(datos.fondo) : '',
    logo: datos.logo ? dataUrl(datos.logo) : '',
    clase_fondo: datos.fondo ? 'con-fondo' : 'sin-fondo',
    clase_logo: datos.logo ? 'con-logo' : 'sin-logo',
    clase_etiqueta: datos.etiqueta ? 'con-etiqueta' : 'sin-etiqueta',
  };
  return html.replace(/\{\{(\w+)\}\}/g, (_, clave: string) => valores[clave] ?? '');
}

/** Renderiza la plantilla en Chromium y devuelve un JPEG del tamaño exacto de la red. */
export async function renderizarJpeg(navegador: Browser, dirPlantillas: string, datos: DatosPlantilla): Promise<Buffer> {
  const html = await readFile(path.join(dirPlantillas, `${datos.plantilla}.html`), 'utf8');
  const pagina = await navegador.newPage({ viewport: { width: datos.ancho, height: datos.alto }, deviceScaleFactor: 1 });
  try {
    await pagina.setContent(rellenarPlantilla(html, datos), { waitUntil: 'networkidle', timeout: 30_000 }).catch(() => undefined);
    // Las plantillas con ajustes en JS (p. ej. la cifra que se encoge) exponen `window.listo`.
    await pagina.evaluate(async () => {
      await document.fonts.ready;
      await (window as { listo?: Promise<unknown> }).listo;
    });
    return await pagina.screenshot({ type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: datos.ancho, height: datos.alto } });
  } finally {
    await pagina.close();
  }
}
