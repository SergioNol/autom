import type { Config } from '../config.ts';

export interface PostAPublicar {
  caption: string;
  altText: string;
  /** URLs públicas (raw.githubusercontent.com); Instagram las descarga desde ahí. */
  urls: string[];
  /** Rutas locales; LinkedIn exige subir los bytes. */
  archivos: string[];
}

export interface Publicado {
  idExterno: string;
  url: string;
}

export type Publicador = (post: PostAPublicar, config: Config['publicacion']) => Promise<Publicado>;

export function secreto(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta el secreto ${nombre}`);
  return valor;
}
