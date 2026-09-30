import { esperar, exigirOk } from '../http.ts';
import { secreto, type Publicador } from './tipos.ts';

const ESPERA_CONTENEDOR_MS = 3000;
const MAX_CONSULTAS_CONTENEDOR = 40;

/**
 * Publica en una cuenta Business/Creator (Content Publishing API).
 * Secretos: IG_ACCESS_TOKEN (instagram_content_publish) e IG_USER_ID.
 * El token va en la cabecera, nunca en la URL, para que no aparezca en errores ni logs.
 */
export const publicarInstagram: Publicador = async (post, config) => {
  const token = secreto('IG_ACCESS_TOKEN');
  const usuario = secreto('IG_USER_ID');
  const base = `https://graph.facebook.com/${config.instagramGraphVersion}`;

  const llamar = async <T>(ruta: string, cuerpo?: Record<string, unknown>): Promise<T> => {
    const respuesta = await fetch(`${base}/${ruta}`, {
      method: cuerpo ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    return (await (await exigirOk(respuesta, `Instagram ${ruta.split('?')[0]}`)).json()) as T;
  };

  /** Los contenedores se procesan de forma asíncrona: hay que esperar a FINISHED antes de publicar. */
  const esperarContenedor = async (id: string) => {
    for (let i = 0; i < MAX_CONSULTAS_CONTENEDOR; i++) {
      const { status_code } = await llamar<{ status_code: string }>(`${id}?fields=status_code`);
      if (status_code === 'FINISHED') return;
      if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`Contenedor de Instagram en estado ${status_code}`);
      await esperar(ESPERA_CONTENEDOR_MS);
    }
    throw new Error('El contenedor de Instagram no terminó de procesarse a tiempo');
  };

  const crear = (cuerpo: Record<string, unknown>) => llamar<{ id: string }>(`${usuario}/media`, cuerpo);

  let contenedor: string;
  if (post.urls.length === 1) {
    contenedor = (await crear({ image_url: post.urls[0], caption: post.caption, alt_text: post.altText })).id;
  } else {
    const hijos: string[] = [];
    for (const url of post.urls) {
      const { id } = await crear({ image_url: url, is_carousel_item: true, alt_text: post.altText });
      await esperarContenedor(id);
      hijos.push(id);
    }
    contenedor = (await crear({ media_type: 'CAROUSEL', children: hijos.join(','), caption: post.caption })).id;
  }
  await esperarContenedor(contenedor);

  const { id } = await llamar<{ id: string }>(`${usuario}/media_publish`, { creation_id: contenedor });
  // Ya está publicado: si falla obtener el enlace, no se debe reintentar la publicación.
  const url = await llamar<{ permalink?: string }>(`${id}?fields=permalink`)
    .then((r) => r.permalink ?? '')
    .catch(() => '');
  return { idExterno: id, url };
};
