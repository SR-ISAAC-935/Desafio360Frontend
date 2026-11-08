import { isAxiosError } from 'axios';

export function mensajeError(e: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (!isAxiosError(e)) return porDefecto;
  if (!e.response) return 'No se pudo conectar con el servidor.';
  return e.response.data?.error?.mensaje ?? porDefecto;
}