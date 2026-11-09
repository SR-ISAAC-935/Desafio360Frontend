import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Pagina } from '../Tipos/catalogo';
import { EstadoConsulta } from './EstadoConsulta';

export interface Columna<T> {
  titulo: string;
  celda: (fila: T) => ReactNode;
}

interface Props<T> {
  consulta: UseQueryResult<Pagina<T>>;
  columnas: Columna<T>[];
  clave: (fila: T) => string | number;
  pagina: number;
  onPagina: (pagina: number) => void;
  mensajeVacio?: string;
}

/**
 * Tabla con paginación del SERVIDOR: la base de datos entrega solo la página pedida y el total.
 * Se usa con useQuery({ placeholderData: keepPreviousData }) para que no parpadee al cambiar de página.
 */
export function TablaPaginada<T>({ consulta, columnas, clave, pagina, onPagina, mensajeVacio = 'No hay registros.' }: Props<T>) {
  const resultado = consulta.data;

  return (
    <EstadoConsulta
      cargando={consulta.isLoading}
      hayError={consulta.isError}
      error={consulta.error}
      vacio={resultado?.datos.length === 0}
      mensajeVacio={mensajeVacio}
      reintentar={() => void consulta.refetch()}
    >
      {resultado && (
        <>
          <div className="tabla-scroll" aria-busy={consulta.isPlaceholderData}>
            <table>
              <thead>
                <tr>{columnas.map((c) => <th key={c.titulo}>{c.titulo}</th>)}</tr>
              </thead>
              <tbody>
                {resultado.datos.map((fila) => (
                  <tr key={clave(fila)}>
                    {columnas.map((c) => <td key={c.titulo} data-etiqueta={c.titulo}>{c.celda(fila)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="paginacion" aria-label="Paginación">
            <button disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>Anterior</button>
            <span>Página {resultado.pagina} de {resultado.totalPaginas} ({resultado.total} registros)</span>
            <button disabled={pagina >= resultado.totalPaginas} onClick={() => onPagina(pagina + 1)}>Siguiente</button>
          </nav>
        </>
      )}
    </EstadoConsulta>
  );
}
