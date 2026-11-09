import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { TablaPaginada, type Columna } from '../Components/TablaPaginada';
import { pedidosService } from '../services/pedidos.services';
import type { PedidoResumen } from '../Tipos/pedidos';
import { fechaHora, q } from '../utils/formato';

const columnas: Columna<PedidoResumen>[] = [
  { titulo: 'Pedido', celda: (p) => `#${p.IDPedido}` },
  { titulo: 'Fecha', celda: (p) => fechaHora(p.FechaPedido) },
  { titulo: 'Estado', celda: (p) => <span className="etiqueta">{p.Estado}</span> },
  { titulo: 'Total', celda: (p) => q(p.Total) },
  { titulo: '', celda: (p) => <Link to={`/pedidos/${p.IDPedido}`}>Ver detalle</Link> },
];

export function MisPedidos() {
  const [pagina, setPagina] = useState(1);
  const [estado, setEstado] = useState<number | undefined>(undefined);

  const estadosQ = useQuery({ queryKey: ['estados-pedido'], queryFn: pedidosService.estados, staleTime: Infinity });
  const consulta = useQuery({
    queryKey: ['mis-pedidos', { pagina, estado }],
    queryFn: () => pedidosService.misPedidos({ pagina, tamanoPagina: 10, estado }),
    placeholderData: keepPreviousData,
  });

  return (
    <section>
      <h1>Mis pedidos</h1>

      <div className="filtros">
        <label>
          Estado{' '}
          <select
            value={estado ?? ''}
            onChange={(e) => { setEstado(e.target.value ? Number(e.target.value) : undefined); setPagina(1); }}
          >
            <option value="">Todos</option>
            {estadosQ.data?.map((e) => (
              <option key={e.IDEstadoPedido} value={e.IDEstadoPedido}>{e.NombreEstado}</option>
            ))}
          </select>
        </label>
      </div>

      <TablaPaginada
        consulta={consulta}
        columnas={columnas}
        clave={(p) => p.IDPedido}
        pagina={pagina}
        onPagina={setPagina}
        mensajeVacio="Todavía no has realizado pedidos."
      />
    </section>
  );
}
