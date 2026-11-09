import { isAxiosError } from 'axios';

export function mensajeError(e: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (!isAxiosError(e)) return porDefecto;
  if (!e.response) return 'No se pudo conectar con el servidor.';
  return e.response.data?.error?.mensaje ?? porDefecto;
}

/** Errores de validación por campo que devuelve el backend: [{ campo, mensaje }]. */
export function detallesError(e: unknown): string[] {
  if (!isAxiosError(e)) return [];
  const detalles: unknown = e.response?.data?.error?.detalles;
  if (!Array.isArray(detalles)) return [];
  return detalles.map((d) => {
    if (d && typeof d === 'object' && 'mensaje' in d) {
      const campo = 'campo' in d && d.campo ? `${String(d.campo)}: ` : '';
      return `${campo}${String(d.mensaje)}`;
    }
    return String(d);
  });
}

export function estadoHttp(e: unknown): number | undefined {
  return isAxiosError(e) ? e.response?.status : undefined;
}
