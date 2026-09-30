// El campo `commentary` de LinkedIn usa "little text format": ciertos caracteres son sintaxis
// y deben escaparse, y los hashtags se expresan como {hashtag|\#|palabra}.

const RESERVADOS = /[\\|{}@[\]()<>#*_~]/g;
const HASHTAG = /#([\p{L}\p{N}_]+)/gu;

const escapar = (texto: string) => texto.replace(RESERVADOS, (c) => `\\${c}`);

export function aLittleText(caption: string): string {
  let resultado = '';
  let ultimo = 0;
  for (const match of caption.matchAll(HASHTAG)) {
    resultado += escapar(caption.slice(ultimo, match.index));
    resultado += `{hashtag|\\#|${escapar(match[1]!)}}`;
    ultimo = match.index + match[0].length;
  }
  return resultado + escapar(caption.slice(ultimo));
}
