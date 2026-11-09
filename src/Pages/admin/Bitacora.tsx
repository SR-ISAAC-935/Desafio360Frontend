import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { TablaPaginada, type Columna } from '../../Components/TablaPaginada';
import { bitacoraAdmin } from '../../services/admin.services';
import { MODULOS_BITACORA, type BitacoraFila } from '../../Tipos/admin';
import { fechaHora } from '../../utils/formato';

/** El servidor guarda los valores como JSON en texto; se muestra con sangría y, si no fuera JSON válido, tal cual. */
function formatearJson(texto: string | null): string {
  if (!texto) return '—';
  try {
    return JSON.stringify(JSON.parse(texto), null, 2);
  } catch {
    return texto;
  }
}

function Cambios({ fila }: { fila: BitacoraFila }) {
  if (!fila.ValorAnterior && !fila.ValorNuevo) return <>—</>;
  return (
    <details>
      <summary>Ver cambios</summary>
      <div className="bitacora-cambios">
        <div>
          <strong>Antes</strong>
          <pre>{formatearJson(fila.ValorAnterior)}</pre>
        </div>
        <div>
          <strong>Después</strong>
          <pre>{formatearJson(fila.ValorNuevo)}</pre>
        </div>
      </div>
    </details>
  );
}

const columnas: Columna<BitacoraFila>[] = [
  { titulo: 'Fecha', celda: (b) => fechaHora(b.FechaHora) },
  { titulo: 'Usuario', celda: (b) => b.Usuario },
  { titulo: 'Módulo', celda: (b) => b.Modulo },
  { titulo: 'Entidad', celda: (b) => `${b.Entidad} #${b.IDEntidad}` },
  { titulo: 'Acción', celda: (b) => <span className="etiqueta">{b.Accion}</span> },
  { titulo: 'Cambios', celda: (b) => <Cambios fila={b} /> },
];

/** Registro de auditoría: solo lectura, solo Administrador. */
export function Bitacora() {
  const [pagina, setPagina] = useState(1);
  const [modulo, setModulo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const rangoInvalido = desde !== '' && hasta !== '' && hasta < desde;

  const consulta = useQuery({
    queryKey: ['bitacora', { pagina, modulo, desde, hasta }],
    queryFn: () =>
      bitacoraAdmin.listar({
        pagina,
        tamanoPagina: 15,
        modulo: modulo || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      }),
    enabled: !rangoInvalido,
    placeholderData: keepPreviousData,
  });

  const cambiar = (accion: () => void) => { accion(); setPagina(1); };

  return (
    <section>
      <h1>Bitácora</h1>
      <p><small>Registro de auditoría de solo lectura: no se puede modificar ni eliminar.</small></p>

      <div className="filtros">
        <select value={modulo} onChange={(e) => cambiar(() => setModulo(e.target.value))} aria-label="Módulo">
          <option value="">Todos los módulos</option>
          {MODULOS_BITACORA.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <label>Desde <input type="date" value={desde} max={hasta || undefined} onChange={(e) => cambiar(() => setDesde(e.target.value))} /></label>
        <label>Hasta <input type="date" value={hasta} min={desde || undefined} onChange={(e) => cambiar(() => setHasta(e.target.value))} /></label>
      </div>
      {rangoInvalido && <p role="alert" className="error">La fecha final no puede ser anterior a la inicial.</p>}

      <TablaPaginada
        consulta={consulta}
        columnas={columnas}
        clave={(b) => b.IDBitacora}
        pagina={pagina}
        onPagina={setPagina}
        mensajeVacio="No hay registros con esos filtros."
      />
    </section>
  );
}
