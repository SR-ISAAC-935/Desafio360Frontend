import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { TablaPaginada, type Columna } from '../../Components/TablaPaginada';
import { useDebounce } from '../../hooks/useDebounce';
import { pedidosService } from '../../services/pedidos.services';
import { ORDEN_PEDIDOS, type OrdenPedidos, type PedidoPersonal } from '../../Tipos/pedidos';
import { fechaHora, q } from '../../utils/formato';

const ETIQUETA_ORDEN: Record<OrdenPedidos, string> = {
  FECHA_DESC: 'Más recientes',
  FECHA_ASC: 'Más antiguos',
  TOTAL_DESC: 'Total (mayor a menor)',
  TOTAL_ASC: 'Total (menor a mayor)',
};

const columnas: Columna<PedidoPersonal>[] = [
  { titulo: 'Pedido', celda: (p) => `#${p.IDPedido}` },
  { titulo: 'Cliente', celda: (p) => <>{p.Cliente}<br /><small>{p.Email}</small></> },
  { titulo: 'Fecha', celda: (p) => fechaHora(p.FechaPedido) },
  { titulo: 'Estado', celda: (p) => <span className="etiqueta">{p.Estado}</span> },
  { titulo: 'Total', celda: (p) => q(p.Total) },
  { titulo: '', celda: (p) => <Link to={`/pedidos/${p.IDPedido}`}>Gestionar</Link> },
];

/** Pedidos de todos los clientes (Operador y Administrador), con filtros y paginación del servidor. */
export function PedidosAdmin() {
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState<number | undefined>(undefined);
  const [cliente, setCliente] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [ordenar, setOrdenar] = useState<OrdenPedidos>('FECHA_DESC');

  const clienteFinal = useDebounce(cliente.trim());
  const rangoInvalido = desde !== '' && hasta !== '' && hasta < desde;

  const estadosQ = useQuery({ queryKey: ['estados-pedido'], queryFn: pedidosService.estados, staleTime: Infinity });
  const consulta = useQuery({
    queryKey: ['pedidos', { pagina, estado, clienteFinal, desde, hasta, ordenar }],
    queryFn: () =>
      pedidosService.listar({
        pagina,
        tamanoPagina: 15,
        estado,
        buscarCliente: clienteFinal || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        ordenar,
      }),
    enabled: !rangoInvalido,
    placeholderData: keepPreviousData,
  });

  const cambiar = (accion: () => void) => { accion(); setPagina(1); };

  return (
    <section>
      <h1>Pedidos</h1>

      <div className="filtros">
        <input
          type="search"
          placeholder="Buscar cliente (nombre o correo)"
          value={cliente}
          onChange={(e) => cambiar(() => setCliente(e.target.value))}
        />
        <select value={estado ?? ''} onChange={(e) => cambiar(() => setEstado(e.target.value ? Number(e.target.value) : undefined))}>
          <option value="">Todos los estados</option>
          {estadosQ.data?.map((e) => <option key={e.IDEstadoPedido} value={e.IDEstadoPedido}>{e.NombreEstado}</option>)}
        </select>
        <label>Desde <input type="date" value={desde} max={hasta || undefined} onChange={(e) => cambiar(() => setDesde(e.target.value))} /></label>
        <label>Hasta <input type="date" value={hasta} min={desde || undefined} onChange={(e) => cambiar(() => setHasta(e.target.value))} /></label>
        <select value={ordenar} onChange={(e) => cambiar(() => setOrdenar(e.target.value as OrdenPedidos))}>
          {ORDEN_PEDIDOS.map((o) => <option key={o} value={o}>{ETIQUETA_ORDEN[o]}</option>)}
        </select>
      </div>

      {rangoInvalido && <p role="alert" className="error">La fecha final no puede ser anterior a la inicial.</p>}

      <TablaPaginada
        consulta={consulta}
        columnas={columnas}
        clave={(p) => p.IDPedido}
        pagina={pagina}
        onPagina={setPagina}
        mensajeVacio="No hay pedidos con esos filtros."
      />
    </section>
  );
}
