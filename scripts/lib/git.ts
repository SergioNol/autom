import { execFileSync } from 'node:child_process';
import { RAIZ } from './repositorio.ts';

const git = (...args: string[]) => execFileSync('git', args, { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

/** Commit de un archivo y push a la rama actual, integrando cambios remotos si el push es rechazado. */
export function commitYPush(archivo: string, mensaje: string, intentos = 3): void {
  git('add', archivo);
  git('commit', '-m', mensaje);
  for (let intento = 1; ; intento++) {
    try {
      git('push');
      return;
    } catch (error) {
      if (intento >= intentos) throw error;
      git('pull', '--rebase');
    }
  }
}
