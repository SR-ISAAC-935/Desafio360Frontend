import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { catalogoService } from '../services/catalogo.services';
import { BotonAgregarCarrito } from '../Components/BotonAgregarCarrito';

const quetzales = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });

export function DetallePublico() {
  const { id } = useParams();
  const idNum = Number(id);
  const idValido = Number.isInteger(idNum) && idNum > 0;
  const [idVariante, setIdVariante] = useState<number | null>(null);

  const consulta = useQuery({
    queryKey: ['producto', idNum],
    queryFn: () => catalogoService.detallepublico(idNum),
    enabled: idValido,
    retry: false,
  });

  if (!idValido) return <p role="alert">El identificador del producto no es válido.</p>;
  if (consulta.isPending) return <p>Cargando producto…</p>;
  if (consulta.isError) {
    const noExiste = isAxiosError(consulta.error) && consulta.error.response?.status === 404;
    return <p role="alert">{noExiste ? 'El producto no existe.' : 'No se pudo cargar el producto.'}</p>;
  }

  const { producto, variantes } = consulta.data;
  const variante = variantes.find((v) => v.IDVariante === idVariante) ?? variantes[0];

  return (
    <article>
      <h1>{producto.NombreProducto}</h1>
      <p>{producto.NombreCategoria}</p>
      {producto.Descripcion && <p><strong>Descripción:</strong><br />
        {producto.Descripcion}</p>}

      {variante?.ImagenUrl && <img src={variante.ImagenUrl} alt={producto.NombreProducto} />}

      <label>
        Variante{' '}
        <select value={variante?.IDVariante} onChange={(e) => setIdVariante(Number(e.target.value))}>
          {variantes.map((v) => (
            <option key={v.IDVariante} value={v.IDVariante}>
              {[v.Talla, v.Color].filter(Boolean).join(' / ') || v.SKU}
            </option>
          ))}
        </select>
      </label>

      {variante && (
        <>
          <p>{quetzales.format(variante.Precio)}</p>
          <p>{variante.Disponible > 0 ? `Disponible: ${variante.Disponible}` : 'Agotado'}</p>
          <BotonAgregarCarrito key={variante.IDVariante} variante={variante} />
        </>
      )}
    </article>
  );
}
