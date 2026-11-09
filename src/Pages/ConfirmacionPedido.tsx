import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { EstadoConsulta } from '../Components/EstadoConsulta';
import { pedidosService } from '../services/pedidos.services';
import { fechaHora, q } from '../utils/formato';

export function ConfirmacionPedido() {
  const { id } = useParams();
  const idNum = Number(id);
  const valido = Number.isInteger(idNum) && idNum > 0;
  const consulta = useQuery({ queryKey: ['pedido', idNum], queryFn: () => pedidosService.detalle(idNum), enabled: valido });

  if (!valido) return <p role="alert" className="error">El pedido no es válido.</p>;

  return (
    <section>
      <EstadoConsulta cargando={consulta.isLoading} hayError={consulta.isError} error={consulta.error} reintentar={() => void consulta.refetch()}>
        {consulta.data && (
          <>
            <h1>¡Gracias por tu compra!</h1>
            <p>Tu pedido <strong>#{consulta.data.pedido.IDPedido}</strong> quedó en estado <span className="etiqueta">{consulta.data.pedido.Estado}</span>.</p>
            <div className="panel">
              <p>Fecha: {fechaHora(consulta.data.pedido.FechaPedido)}</p>
              <p>Entrega en: {consulta.data.pedido.DireccionEntrega}</p>
              <ul>
                {consulta.data.lineas.map((l) => (
                  <li key={l.IDPedidoDetalle}>{l.NombreProducto} {[l.Talla, l.Color].filter(Boolean).join(' / ')} × {l.Cantidad} — {q(l.TotalLinea)}</li>
                ))}
              </ul>
              <p><strong>Total pagado: {q(consulta.data.pedido.Total)}</strong></p>
              {consulta.data.pagos[0] && <p><small>Referencia de pago: {consulta.data.pagos[0].Referencia ?? '—'} ({consulta.data.pagos[0].Metodo})</small></p>}
            </div>
            <div className="botones">
              <Link className="boton" to={`/pedidos/${consulta.data.pedido.IDPedido}`}>Ver detalle del pedido</Link>
              <Link to="/mis-pedidos">Mis pedidos</Link>
              <Link to="/">Seguir comprando</Link>
            </div>
          </>
        )}
      </EstadoConsulta>
    </section>
  );
}
