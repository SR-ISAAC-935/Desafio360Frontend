import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Direcciones } from '../Components/Direcciones';
import { EstadoConsulta } from '../Components/EstadoConsulta';
import { MensajeError } from '../Components/MensajeError';
import { useCarrito } from '../hooks/useCarrito';
import { checkoutService } from '../services/checkout.services';
import { METODOS_PAGO, type MetodoPago, type Reserva } from '../Tipos/checkout';
import { estadoHttp } from '../utils/errores';
import { q } from '../utils/formato';

const ETIQUETA_METODO: Record<MetodoPago, string> = { TARJETA: 'Tarjeta (simulado)', TRANSFERENCIA: 'Transferencia (simulado)' };

const dosDigitos = (n: number) => String(n).padStart(2, '0');

/** Cuenta regresiva hasta que vence la reserva; avisa una sola vez cuando llega a cero. */
function useCuentaRegresiva(vence: Date | null, alVencer: () => void) {
  const [restante, setRestante] = useState(0);
  const aviso = useRef(alVencer);
  useEffect(() => { aviso.current = alVencer; });

  useEffect(() => {
    if (!vence) return;
    const tic = () => {
      const ms = vence.getTime() - Date.now();
      setRestante(Math.max(0, ms));
      if (ms <= 0) { clearInterval(id); aviso.current(); }
    };
    const id = setInterval(tic, 1000);
    tic();
    return () => clearInterval(id);
  }, [vence]);

  return restante;
}

export function Checkout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const carrito = useCarrito();

  const [idDireccion, setIdDireccion] = useState<number | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>('TARJETA');
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [vencida, setVencida] = useState(false);
  // Una llave por intento de compra: si el usuario da doble clic o reintenta tras una falla de red, el servidor no duplica el pedido.
  const llave = useRef(crypto.randomUUID());

  const vence = reserva?.venceEn ? new Date(reserva.venceEn) : null;
  const restante = useCuentaRegresiva(vence, () => { setReserva(null); setVencida(true); });

  const reservar = useMutation({
    mutationFn: checkoutService.reservar,
    onSuccess: (r) => { setReserva(r); setVencida(false); },
  });

  const pagar = useMutation({
    mutationFn: () => checkoutService.pagar({ idDireccion: idDireccion as number, llaveIdempotencia: llave.current, metodoPago: metodo }),
    onSuccess: async ({ idPedido }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['carrito'] }),
        qc.invalidateQueries({ queryKey: ['pedidos'] }),
      ]);
      void navigate(`/pedido/${idPedido}/confirmacion`, { replace: true });
    },
    onError: (e) => {
      // 409 = la reserva venció o un precio cambió: hay que reservar de nuevo y se genera una llave nueva.
      if (estadoHttp(e) === 409) { setReserva(null); llave.current = crypto.randomUUID(); void carrito.refetch(); }
    },
  });

  const data = carrito.data;
  const hayLineas = (data?.lineas.length ?? 0) > 0;
  const sinExistencia = data?.lineas.some((l) => Boolean(l.SinExistencia)) ?? false;
  const bloqueado = reservar.isPending || pagar.isPending;

  return (
    <section>
      <h1>Finalizar compra</h1>

      <EstadoConsulta
        cargando={carrito.isLoading}
        hayError={carrito.isError}
        error={carrito.error}
        vacio={!hayLineas}
        mensajeVacio="Tu carrito está vacío."
        reintentar={() => void carrito.refetch()}
      >
        {data && (
          <>
            <div className="panel">
              <h2>Resumen</h2>
              <ul>
                {data.lineas.map((l) => (
                  <li key={l.IDVariante}>
                    {l.NombreProducto} {[l.Talla, l.Color].filter(Boolean).join(' / ')} × {l.Cantidad} — {q(l.TotalLinea)}
                    {Boolean(l.SinExistencia) && <strong className="error"> (sin existencia)</strong>}
                  </li>
                ))}
              </ul>
              <p>Subtotal: {q(data.totales.Subtotal)}</p>
              {data.totales.Descuento > 0 && <p>Descuento{data.carrito.CodigoCupon ? ` (${data.carrito.CodigoCupon})` : ''}: −{q(data.totales.Descuento)}</p>}
              <p><strong>Total: {q(data.totales.Total)}</strong> <small>(IVA incluido: {q(data.totales.IVAIncluido)})</small></p>
              <Link to="/carrito">Modificar carrito</Link>
            </div>

            <Direcciones seleccionada={idDireccion} onSeleccion={setIdDireccion} deshabilitado={bloqueado} />

            <fieldset className="panel" disabled={bloqueado}>
              <legend>Método de pago</legend>
              {METODOS_PAGO.map((m) => (
                <label key={m} style={{ display: 'block' }}>
                  <input type="radio" name="metodo" checked={metodo === m} onChange={() => setMetodo(m)} /> {ETIQUETA_METODO[m]}
                </label>
              ))}
              <small>El pago es simulado: no se solicitan datos de tarjeta.</small>
            </fieldset>

            {sinExistencia && <p role="alert" className="error">Hay productos sin existencia. Ajusta tu carrito para continuar.</p>}
            {vencida && <p role="alert" className="error">Tu reserva venció. Vuelve a reservar para continuar.</p>}
            <MensajeError error={reservar.error} />
            <MensajeError error={pagar.error} />

            {!reserva ? (
              <button type="button" disabled={bloqueado || sinExistencia || idDireccion === null} onClick={() => reservar.mutate()}>
                {reservar.isPending ? 'Reservando…' : '1. Reservar existencia (15 min)'}
              </button>
            ) : (
              <div className="panel">
                <p aria-live="polite">
                  Existencia reservada. Tiempo para pagar: <strong>{dosDigitos(Math.floor(restante / 60000))}:{dosDigitos(Math.floor((restante % 60000) / 1000))}</strong>
                </p>
                <button type="button" className="primario" disabled={bloqueado || idDireccion === null} onClick={() => pagar.mutate()}>
                  {pagar.isPending ? 'Procesando…' : `2. Pagar ${q(data.totales.Total)}`}
                </button>
              </div>
            )}
            {idDireccion === null && <p><small>Elige o agrega una dirección de entrega para continuar.</small></p>}
          </>
        )}
      </EstadoConsulta>
    </section>
  );
}
