import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Config } from '../config.ts';
import { conReintentos, exigirOk } from '../http.ts';

const API = 'https://api.openai.com/v1/images';

export interface Uso {
  textoEntrada: number;
  imagenEntrada: number;
  imagenSalida: number;
}

export interface ResultadoImagen {
  imagenes: Buffer[];
  uso: Uso;
}

interface RespuestaOpenAI {
  data: { b64_json: string }[];
  usage?: {
    output_tokens?: number;
    input_tokens_details?: { text_tokens?: number; image_tokens?: number };
  };
}

const MIME: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

/**
 * Genera `n` imágenes (JPEG). Con referencias (rutas del repo o imágenes ya generadas en memoria) usa /edits; sin ellas, /generations.
 * La API key solo se lee del entorno (GitHub Secrets).
 */
export async function generarImagen(
  args: { prompt: string; tamano: string; n: number; referencias: string[]; generadas?: Buffer[] },
  config: Config['imagenes'],
  raiz: string,
): Promise<ResultadoImagen> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Falta OPENAI_API_KEY');
  const headers = { Authorization: `Bearer ${apiKey}` };
  const comunes = { model: config.modelo, prompt: args.prompt, size: args.tamano, quality: config.calidad, n: args.n, output_format: 'jpeg' };

  const respuesta = await conReintentos(3, async () => {
    const generadas = args.generadas ?? [];
    if (args.referencias.length === 0 && generadas.length === 0) {
      return exigirOk(
        await fetch(`${API}/generations`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(comunes) }),
        'OpenAI generations',
      );
    }
    const form = new FormData();
    for (const [clave, valor] of Object.entries(comunes)) form.set(clave, String(valor));
    for (const ref of args.referencias) {
      const datos = await readFile(path.join(raiz, ref));
      form.append('image[]', new Blob([datos], { type: MIME[path.extname(ref).toLowerCase()] ?? 'image/png' }), path.basename(ref));
    }
    for (const [i, datos] of generadas.entries()) form.append('image[]', new Blob([new Uint8Array(datos)], { type: 'image/jpeg' }), `generada-${i + 1}.jpg`);
    return exigirOk(await fetch(`${API}/edits`, { method: 'POST', headers, body: form }), 'OpenAI edits');
  });

  const json = (await respuesta.json()) as RespuestaOpenAI;
  return {
    imagenes: json.data.map((d) => Buffer.from(d.b64_json, 'base64')),
    uso: {
      textoEntrada: json.usage?.input_tokens_details?.text_tokens ?? 0,
      imagenEntrada: json.usage?.input_tokens_details?.image_tokens ?? 0,
      imagenSalida: json.usage?.output_tokens ?? 0,
    },
  };
}

export function costoUsd(uso: Uso, precios: Config['imagenes']['precioUsdPorMillonTokens']): number {
  const total = uso.textoEntrada * precios.textoEntrada + uso.imagenEntrada * precios.imagenEntrada + uso.imagenSalida * precios.imagenSalida;
  return Math.round((total / 1_000_000) * 10_000) / 10_000;
}
