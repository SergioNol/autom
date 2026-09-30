import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Browser } from 'playwright';
import type { Config } from './config.ts';
import { costoUsd, generarImagen } from './imagenes/openai.ts';
import { renderizarJpeg } from './imagenes/plantillas.ts';
import type { Slot } from './lote.ts';
import { dirGeneracion, type ImagenPlan, type Plan, type PostPlan } from './plan.ts';
import { serializarPost } from './post.ts';
import { DIR_POSTS, RAIZ } from './repositorio.ts';

export interface Costos {
  totalUsd: number;
  detalle: { carpeta: string; imagen: string; usd: number }[];
}

export interface ResultadoMaterializar {
  posts: number;
  imagenesNuevas: number;
  variantes: string[];
  costos: Costos;
}

interface Contexto {
  lote: string;
  config: Config;
  navegador: Browser;
  logo: Buffer | null;
  simular: boolean;
  costos: Costos;
  resultado: ResultadoMaterializar;
}

const relativa = (ruta: string) => path.relative(RAIZ, ruta).split(path.sep).join('/');

async function leerCostos(archivo: string): Promise<Costos> {
  return existsSync(archivo) ? (JSON.parse(await readFile(archivo, 'utf8')) as Costos) : { totalUsd: 0, detalle: [] };
}

/** Devuelve los fondos de una imagen: el elegido y, si aplica, las variantes alternativas. */
async function obtenerFondos(ctx: Contexto, post: PostPlan, slot: Slot, img: ImagenPlan, esPortada: boolean): Promise<(Buffer | null)[]> {
  if (img.fuente === 'sin-fondo') return [null];
  if (img.fuente === 'foto-real') return [await readFile(path.join(RAIZ, img.foto))];
  if (ctx.simular) return [null];

  const n = esPortada ? ctx.config.imagenes.variantesPortada : 1;
  const { imagenes, uso } = await generarImagen(
    { prompt: img.prompt, tamano: ctx.config.formatos[slot.red].tamanoGeneracion, n, referencias: img.referencias },
    ctx.config.imagenes,
    RAIZ,
  );
  const usd = costoUsd(uso, ctx.config.imagenes.precioUsdPorMillonTokens);
  ctx.costos.detalle.push({ carpeta: post.carpeta, imagen: img.prompt.slice(0, 60), usd });
  ctx.costos.totalUsd = Math.round((ctx.costos.totalUsd + usd) * 10_000) / 10_000;
  return imagenes;
}

async function materializarPost(ctx: Contexto, post: PostPlan, slot: Slot): Promise<void> {
  const dir = path.join(DIR_POSTS, ctx.lote, post.carpeta);
  await mkdir(dir, { recursive: true });

  const prompts = post.imagenes.flatMap((img, i) => (img.fuente === 'ia' ? [`[${i + 1}] ${img.prompt}`] : []));
  const texto = serializarPost(
    {
      red: slot.red, formato: post.formato, fecha: slot.fecha, pilar: post.pilar, estado: 'por-revisar',
      comentario_revision: '', alt_text: post.altText, prompt_imagen: prompts.join('\n'),
      id_externo: '', publicado_en: '', error: '',
    },
    post.caption,
  );
  await writeFile(path.join(dir, 'post.md'), texto);

  const { ancho, alto } = ctx.config.formatos[slot.red];
  for (const [i, img] of post.imagenes.entries()) {
    const destino = path.join(dir, `imagen-${i + 1}.jpg`);
    if (existsSync(destino)) continue; // reanudar sin volver a pagar imágenes ya generadas

    const fondos = await obtenerFondos(ctx, post, slot, img, i === 0);
    const render = (fondo: Buffer | null) =>
      renderizarJpeg(ctx.navegador, path.join(RAIZ, 'visual', 'plantillas'), {
        plantilla: img.plantilla, fondo, logo: ctx.logo, ...img.textos, ancho, alto, marca: ctx.config.marca,
      });

    await writeFile(destino, await render(fondos[0] ?? null));
    ctx.resultado.imagenesNuevas++;

    for (const [v, fondo] of fondos.slice(1).entries()) {
      const dirVariantes = path.join(dirGeneracion(ctx.lote), 'variantes', post.carpeta);
      await mkdir(dirVariantes, { recursive: true });
      const archivo = path.join(dirVariantes, `imagen-${i + 1}-alternativa-${v + 2}.jpg`);
      await writeFile(archivo, await render(fondo));
      ctx.resultado.variantes.push(relativa(archivo));
    }
  }
  ctx.resultado.posts++;
}

/** Escribe `posts/<lote>/*` (post.md + JPEG) a partir del plan ya validado. */
export async function materializarLote(plan: Plan, slots: Slot[], config: Config, simular: boolean): Promise<ResultadoMaterializar> {
  const archivoCostos = path.join(dirGeneracion(plan.lote), 'costos.json');
  const rutaLogo = path.join(RAIZ, config.marca.logo);
  const navegador = await chromium.launch();
  const ctx: Contexto = {
    lote: plan.lote,
    config,
    navegador,
    logo: existsSync(rutaLogo) ? await readFile(rutaLogo) : null,
    simular,
    costos: await leerCostos(archivoCostos),
    resultado: { posts: 0, imagenesNuevas: 0, variantes: [], costos: { totalUsd: 0, detalle: [] } },
  };
  const porCarpeta = new Map(slots.map((s) => [s.carpeta, s]));

  try {
    for (const post of plan.posts) await materializarPost(ctx, post, porCarpeta.get(post.carpeta)!);
  } finally {
    await navegador.close();
    // Se guarda incluso si algo falló, para no perder el registro de lo ya pagado.
    await mkdir(path.dirname(archivoCostos), { recursive: true });
    await writeFile(archivoCostos, `${JSON.stringify(ctx.costos, null, 2)}\n`);
  }
  ctx.resultado.costos = ctx.costos;
  return ctx.resultado;
}
