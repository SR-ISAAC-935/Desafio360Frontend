import { detallesError, mensajeError } from '../utils/errores';

/** Muestra el mensaje del servidor y, si es un error de validación, el detalle campo por campo. */
export function MensajeError({ error, porDefecto }: { error: unknown; porDefecto?: string }) {
  if (!error) return null;
  const detalles = detallesError(error);
  return (
    <div role="alert" className="error">
      <p>{mensajeError(error, porDefecto)}</p>
      {detalles.length > 0 && (
        <ul>
          {detalles.map((d) => <li key={d}>{d}</li>)}
        </ul>
      )}
    </div>
  );
}
