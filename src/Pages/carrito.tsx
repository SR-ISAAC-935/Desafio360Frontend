import { Link } from 'react-router-dom';
import { useCarrito, useCarritoAcciones } from '../hooks/useCarrito';
import { mensajeError } from '../utils/errores';

const quetzales = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

export function Carrito() {
  const { data, isLoading, isError, error } = useCarrito();
  const { cambiarCantidad, quitar } = useCarritoAcciones();
  const ocupado = cambiarCantidad.isPending || quitar.isPending;

  if (isLoading) return <p>Cargando carrito…</p>;
  if (isError) return <p role="alert">{mensajeError(error, 'No se pudo cargar el carrito.')}</p>;

  if (!data || data.lineas.length === 0) {
    return (
      <section>
        <h1>Carrito</h1>
        <p>Tu carrito está vacío.</p>
        <Link to="/">Ir al catálogo</Link>
      </section>
    );
  }

  const { lineas, totales } = data;

  return (
    <section>
      <h1>Carrito</h1>

      {lineas.map((l) => (
        <article key={l.IDVariante}>
          {l.ImagenUrl
            ? <img src={l.ImagenUrl} alt={l.NombreProducto} loading="lazy" width={80} />
            : <div aria-hidden="true">Sin imagen</div>}

          <h3>{l.NombreProducto}</h3>
          <p>{[l.Talla, l.Color].filter(Boolean).join(' / ') || l.SKU}</p>
          <p>Precio: {quetzales.format(l.PrecioUnitario)}</p>

          <div>
            <button
              disabled={ocupado || l.Cantidad <= 1}
              onClick={() => cambiarCantidad.mutate({ idVariante: l.IDVariante, cantidad: l.Cantidad - 1 })}
            >
              −
            </button>

            <input
              key={l.Cantidad} // se reinicia cuando el servidor confirma el cambio
              type="number"
              min={1}
              max={l.Disponible}
              defaultValue={l.Cantidad}
              disabled={ocupado}
              onBlur={(e) => {
                const n = Math.min(Math.max(Math.trunc(Number(e.target.value)) || 1, 1), Math.max(l.Disponible, 1));
                if (n !== l.Cantidad) cambiarCantidad.mutate({ idVariante: l.IDVariante, cantidad: n });
                else e.target.value = String(l.Cantidad);
              }}
            />

            <button
              disabled={ocupado || l.Cantidad >= l.Disponible}
              onClick={() => cambiarCantidad.mutate({ idVariante: l.IDVariante, cantidad: l.Cantidad + 1 })}
            >
              +
            </button>

            <button disabled={ocupado} onClick={() => quitar.mutate(l.IDVariante)}>
              Quitar
            </button>
          </div>

          <p>Total: {quetzales.format(l.TotalLinea)}</p>

          {Boolean(l.SinExistencia) && (
            <p role="alert">Este producto ya no tiene existencias suficientes.</p>
          )}
        </article>
      ))}

      <aside>
        <p>Subtotal: {quetzales.format(totales.Subtotal)}</p>
        {totales.Descuento > 0 && <p>Descuento: {quetzales.format(totales.Descuento)}</p>}
        <p><strong>Total: {quetzales.format(totales.Total)}</strong></p>
        <p>IVA incluido: {quetzales.format(totales.IVAIncluido)}</p>
      </aside>

      {cambiarCantidad.isError && <p role="alert">{mensajeError(cambiarCantidad.error)}</p>}
      {quitar.isError && <p role="alert">{mensajeError(quitar.error)}</p>}
    </section>
  );
}