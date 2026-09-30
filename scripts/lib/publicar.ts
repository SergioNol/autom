import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Config } from './config.ts';
import { commitYPush } from './git.ts';
import { conReintentos } from './http.ts';
import { actualizarFrontmatter, parsearPost, type Frontmatter, type Red } from './post.ts';
import { decidirPublicacion } from './publicacion.ts';
import { publicarInstagram } from './redes/instagram.ts';
import { publicarLinkedIn } from './redes/linkedin.ts';
import type { Publicador } from './redes/tipos.ts';
import { DIR_POSTS, RAIZ, leerPilares, listarPosts, type PostEnDisco } from './repositorio.ts';
import { validarPost } from './validacion.ts';

const PUBLICADORES: Record<Red, Publicador> = { instagram: publicarInstagram, linkedin: publicarLinkedIn };

export interface OpcionesPublicacion {
  ahora: Date;
  config: Config;
  /** owner/repo, para las URLs públicas de raw.githubusercontent.com */
  repositorio: string;
  simular: boolean;
  commit: boolean;
}

export interface ResumenPublicacion {
  publicados: string[];
  fallidos: string[];
  pendientes: number;
}

const imagenesDe = (post: PostEnDisco) =>
  post.archivos.filter((a) => /^imagen-\d+\.jpg$/.test(a)).sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));

async function intentarPublicar(post: PostEnDisco, datos: Frontmatter, caption: string, opciones: OpcionesPublicacion): Promise<Partial<Frontmatter>> {
  const errores = await validarPost(post, DIR_POSTS, await leerPilares());
  if (errores.length > 0) return { estado: 'fallido', error: `post inválido: ${errores.join('; ')}` };

  const imagenes = imagenesDe(post);
  try {
    const { idExterno, url } = await conReintentos(
      opciones.config.publicacion.intentos,
      () =>
        PUBLICADORES[datos.red](
          {
            caption,
            altText: datos.alt_text,
            urls: imagenes.map((i) => `https://raw.githubusercontent.com/${opciones.repositorio}/main/${post.ruta}/${i}`),
            archivos: imagenes.map((i) => path.join(RAIZ, post.ruta, i)),
          },
          opciones.config.publicacion,
        ),
      true,
    );
    if (url) console.log(`  → ${url}`);
    return { estado: 'publicado', id_externo: idExterno, publicado_en: opciones.ahora.toISOString(), error: '' };
  } catch (error) {
    return { estado: 'fallido', error: (error as Error).message.slice(0, 500) };
  }
}

/** Recorre posts/ y publica lo aprobado cuya fecha llegó. Cada cambio de estado se commitea al momento. */
export async function publicarPendientes(opciones: OpcionesPublicacion): Promise<ResumenPublicacion> {
  const resumen: ResumenPublicacion = { publicados: [], fallidos: [], pendientes: 0 };

  for (const post of await listarPosts()) {
    if (!post.texto) continue;
    let parseado: ReturnType<typeof parsearPost>;
    try {
      parseado = parsearPost(post.texto);
    } catch {
      continue; // el check de validación del PR ya lo habría marcado
    }
    const datos = parseado.datos as unknown as Frontmatter;
    const { caption } = parseado;

    const decision = decidirPublicacion(datos, opciones.ahora, opciones.config.publicacion.margenVencidoHoras);
    if (decision === 'ignorar') continue;
    if (decision === 'esperar') {
      resumen.pendientes++;
      continue;
    }

    if (opciones.simular) {
      console.log(`[simulación] ${post.ruta}: ${decision}`);
      continue;
    }

    const cambios: Partial<Frontmatter> =
      decision === 'vencido'
        ? { estado: 'fallido', error: `fecha vencida (más de ${opciones.config.publicacion.margenVencidoHoras} h de retraso): reprograma y vuelve a poner por-revisar` }
        : await intentarPublicar(post, datos, caption, opciones);

    const archivo = path.join(RAIZ, post.ruta, 'post.md');
    await writeFile(archivo, actualizarFrontmatter(post.texto, cambios));
    (cambios.estado === 'publicado' ? resumen.publicados : resumen.fallidos).push(post.ruta);
    console.log(`${post.ruta}: ${cambios.estado}${cambios.error ? ` — ${cambios.error}` : ''}`);

    if (opciones.commit) commitYPush(archivo, `publicar: ${post.carpeta} → ${cambios.estado}`);
  }
  return resumen;
}
