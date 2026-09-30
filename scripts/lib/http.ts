export class ErrorHttp extends Error {
  readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorHttp';
    this.status = status;
  }

  /** 429 y 5xx suelen ser transitorios. */
  get reintentable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

export const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Lanza ErrorHttp con el cuerpo de la respuesta (nunca con la URL, que podría llevar credenciales). */
export async function exigirOk(respuesta: Response, contexto: string): Promise<Response> {
  if (respuesta.ok) return respuesta;
  const cuerpo = (await respuesta.text().catch(() => '')).slice(0, 500);
  throw new ErrorHttp(respuesta.status, `${contexto}: HTTP ${respuesta.status} ${cuerpo}`);
}

/**
 * Reintenta errores transitorios con espera exponencial (2 s, 4 s, 8 s…).
 * `soloHttp`: no reintenta errores de red, porque la petición pudo llegar y el reintento duplicaría (publicación).
 */
export async function conReintentos<T>(intentos: number, fn: () => Promise<T>, soloHttp = false): Promise<T> {
  for (let intento = 1; ; intento++) {
    try {
      return await fn();
    } catch (error) {
      const transitorio = error instanceof ErrorHttp ? error.reintentable : !soloHttp;
      if (intento >= intentos || !transitorio) throw error;
      await esperar(2000 * 2 ** (intento - 1));
    }
  }
}
