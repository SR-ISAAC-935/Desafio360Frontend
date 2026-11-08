import { Link } from 'react-router-dom';
import type { ProductoCard } from '../Tipos/catalogo';

const quetzales = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

export function TarjetaProducto({ producto }: { producto: ProductoCard }) {
  const { IDProducto, NombreProducto, NombreCategoria, PrecioMin, PrecioMax, Disponible, ImagenUrl } = producto;

  const precio = PrecioMin === PrecioMax
    ? quetzales.format(PrecioMin)
    : `${quetzales.format(PrecioMin)} – ${quetzales.format(PrecioMax)}`;

  return (
    <article>
      <Link to={`/catalogo/producto/${IDProducto}`}>
        {ImagenUrl
          ? <img src={ImagenUrl} alt={NombreProducto} loading="lazy" />
          : <div aria-hidden="true">Sin imagen</div>}
        <h3>{NombreProducto}</h3>
      </Link>
      <p>{NombreCategoria}</p>
      <p>{precio}</p>
      <p>{Disponible > 0 ? `Disponible: ${Disponible}` : 'Agotado'}</p>
    </article>
  );
}