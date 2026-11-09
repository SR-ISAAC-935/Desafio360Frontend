import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AvanzarEstado, CancelarPedido, DevolverPedido } from '../Components/AccionesPedido';
import { useAuth } from '../hooks/useAuth';
import { pedidosService } from '../services/pedidos.services';
import { ESTADOS_CANCELABLES, ESTADOS_DEVOLVIBLES, SIGUIENTE_ESTADO } from '../Tipos/pedidos';
import { estadoHttp } from '../utils/errores';
import { fechaHora, q } from '../utils/formato';

/** Detalle de un pedido. Lo ve su dueño (cliente) o el personal; el servidor responde 403 a cualquier otro. */
export function DetallePedido() {
  const { id } = useParams();
  const idNum = Number(id);
  const idValido = Number.isInteger(idNum) && idNum > 0;
  const { usuario } = useAuth();

  const consulta = useQuery({
    queryKey: ['pedido', idNum],
    queryFn: () => pedidosService.detalle(idNum),
    enabled: idValido,
    retry: false,
  });

  if (!idValido) return <p role="alert">El identificador del pedido no es válido.</p>;
  if (consulta.isPending) return <p>Cargando pedido…</p>;
  if (consulta.isError) {
    const estado = estadoHttp(consulta.error);
    const mensaje =
      estado === 403 ? 'No tienes acceso a este pedido.'
      : estado === 404 ? 'El pedido no existe.'
      : 'No se pudo cargar el pedido.';
    return <p role="alert">{mensaje}</p>;
  }

  const { pedido, lineas, historial, pagos } = consulta.data;
  const esPersonal = usuario?.NombreRol === 'Operador' || usuario?.NombreRol === 'Administrador';
  const esDueno = usuario?.IDUsuario === pedido.IDUsuario;

  const puedeCancelar = (esDueno || esPersonal) && ESTADOS_CANCELABLES.includes(pedido.Estado);
  const siguiente = esPersonal ? SIGUIENTE_ESTADO[pedido.Estado] : undefined;
  const puedeDevolver = esPersonal && ESTADOS_DEVOLVIBLES.includes(pedido.Estado);

  return (
    <section>
      <p><Link to={esPersonal ? '/admin/pedidos' : '/mis-pedidos'}>← Volver a pedidos</Link></p>
      <h1>Pedido #{pedido.IDPedido}</h1>
      <p><span className="etiqueta">{pedido.Estado}</span> · {fechaHora(pedido.FechaPedido)}</p>
      {esPersonal && <p>Cliente: {pedido.Cliente} ({pedido.Email})</p>}
      <p>Entrega: {pedido.DireccionEntrega}</p>

      <h2>Productos</h2>
      <div className="tabla-scroll">
        <table>
          <thead>
            <tr><th>Producto</th><th>SKU</th><th>Cant.</th><th>Precio</th><th>Descuento</th><th>Total</th><th>Devueltas</th></tr>
          </thead>
          <tbody>
            {lineas.map((l) => (
              <tr key={l.IDPedidoDetalle}>
                <td data-etiqueta="Producto">{l.NombreProducto}{[l.Talla, l.Color].filter(Boolean).length > 0 && ` (${[l.Talla, l.Color].filter(Boolean).join(' / ')})`}</td>
                <td data-etiqueta="SKU">{l.SKU}</td>
                <td data-etiqueta="Cant.">{l.Cantidad}</td>
                <td data-etiqueta="Precio">{q(l.PrecioUnitario)}</td>
                <td data-etiqueta="Descuento">{q(l.DescuentoLinea)}</td>
                <td data-etiqueta="Total">{q(l.TotalLinea)}</td>
                <td data-etiqueta="Devueltas">{l.CantidadDevuelta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <aside className="totales">
        <p>Subtotal: {q(pedido.Subtotal)}</p>
        {pedido.Descuento > 0 && <p>Descuento{pedido.CodigoCupon ? ` (${pedido.CodigoCupon})` : ''}: {q(pedido.Descuento)}</p>}
        <p><strong>Total: {q(pedido.Total)}</strong></p>
        <p>IVA incluido: {q(pedido.MontoIVA)}</p>
      </aside>

      <h2>Pagos</h2>
      {pagos.length === 0 ? <p>Sin pagos registrados.</p> : (
        <ul>
          {pagos.map((p) => (
            <li key={p.IDPago}>{fechaHora(p.FechaPago)} · {p.Metodo} · {q(p.Monto)} · {p.Estado}{p.Referencia ? ` · ${p.Referencia}` : ''}</li>
          ))}
        </ul>
      )}

      <h2>Historial</h2>
      <ol>
        {historial.map((h) => (
          <li key={`${h.FechaCambio}-${h.EstadoNuevo}`}>
            {fechaHora(h.FechaCambio)} · {h.EstadoAnterior ? `${h.EstadoAnterior} → ` : ''}{h.EstadoNuevo} · {h.Usuario}
            {h.Comentario ? ` · ${h.Comentario}` : ''}
          </li>
        ))}
      </ol>

      {siguiente && <AvanzarEstado idPedido={pedido.IDPedido} siguiente={siguiente} />}
      {puedeDevolver && <DevolverPedido idPedido={pedido.IDPedido} lineas={lineas} />}
      {puedeCancelar && <CancelarPedido idPedido={pedido.IDPedido} />}
    </section>
  );
}
