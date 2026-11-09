import type { ReactNode } from 'react';
import { mensajeError } from '../utils/errores';

interface Props {
  cargando: boolean;
  hayError: boolean;
  error?: unknown;
  vacio?: boolean;
  mensajeVacio?: string;
  reintentar?: () => void;
  children: ReactNode;
}

/** Los tres estados que toda pantalla con datos del servidor debe cubrir: cargando, error y vacío. */
export function EstadoConsulta({ cargando, hayError, error, vacio, mensajeVacio = 'No hay datos para mostrar.', reintentar, children }: Props) {
  if (cargando) return <p className="estado" aria-busy="true">Cargando…</p>;
  if (hayError) {
    return (
      <div role="alert" className="error">
        <p>{mensajeError(error, 'No se pudieron cargar los datos.')}</p>
        {reintentar && <button onClick={reintentar}>Reintentar</button>}
      </div>
    );
  }
  if (vacio) return <p className="estado">{mensajeVacio}</p>;
  return <>{children}</>;
}
