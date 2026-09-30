import { readFile } from 'node:fs/promises';
import { exigirOk } from '../http.ts';
import { aLittleText } from './linkedin-texto.ts';
import { secreto, type Publicador } from './tipos.ts';

const API = 'https://api.linkedin.com/rest';

/**
 * Publica en la página de empresa (Posts API + Images API).
 * Secretos: LINKEDIN_ACCESS_TOKEN (w_organization_social) y LINKEDIN_ORG_ID.
 */
export const publicarLinkedIn: Publicador = async (post, config) => {
  const token = secreto('LINKEDIN_ACCESS_TOKEN');
  const autor = `urn:li:organization:${secreto('LINKEDIN_ORG_ID')}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'LinkedIn-Version': config.linkedinVersion,
    'X-Restli-Protocol-Version': '2.0.0',
    'Content-Type': 'application/json',
  };

  const subirImagen = async (archivo: string): Promise<string> => {
    const inicio = await exigirOk(
      await fetch(`${API}/images?action=initializeUpload`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ initializeUploadRequest: { owner: autor } }),
      }),
      'LinkedIn initializeUpload',
    );
    const { value } = (await inicio.json()) as { value: { uploadUrl: string; image: string } };
    await exigirOk(
      await fetch(value.uploadUrl, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: await readFile(archivo) }),
      'LinkedIn subida de imagen',
    );
    return value.image;
  };

  const imagenes: string[] = [];
  for (const archivo of post.archivos) imagenes.push(await subirImagen(archivo));

  const content =
    imagenes.length === 1
      ? { media: { id: imagenes[0], altText: post.altText } }
      : { multiImage: { images: imagenes.map((id) => ({ id, altText: post.altText })) } };

  const respuesta = await exigirOk(
    await fetch(`${API}/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        author: autor,
        commentary: aLittleText(post.caption),
        visibility: 'PUBLIC',
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
        content,
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    }),
    'LinkedIn crear post',
  );

  const idExterno = respuesta.headers.get('x-restli-id') ?? '';
  return { idExterno, url: idExterno ? `https://www.linkedin.com/feed/update/${idExterno}/` : '' };
};
