/** Quita los filtros vacíos antes de enviarlos: el backend rechaza cadenas vacías en números y fechas. */
export function sinVacios<T extends object>(filtros: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
}
