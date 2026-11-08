import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { TarjetaProducto } from '../Components/TarjetaProducto';
import { catalogoService } from '../services/catalogo.services';
import { useDebounce } from '../hooks/useDebounce';
import { ORDEN_CATALOGO, type OrdenCatalogo } from '../Tipos/catalogo';

const ETIQUETA_ORDEN: Record<OrdenCatalogo, string> = {
  NOMBRE_ASC: 'Nombre (A-Z)',
  NOMBRE_DESC: 'Nombre (Z-A)',
  PRECIO_ASC: 'Precio (menor a mayor)',
  PRECIO_DESC: 'Precio (mayor a menor)',
};

export function Catalogo() {
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState<number | undefined>(undefined);
  const [ordenar, setOrdenar] = useState<OrdenCatalogo>('NOMBRE_ASC');
  const [soloDisponibles] = useState(false);
  const [pagina, setPagina] = useState(1);

  const textoFinal = useDebounce(texto.trim());

  const categoriasQ = useQuery({
    queryKey: ['categorias'],
    queryFn: catalogoService.categorias,
  });

  // Al cambiar cualquier valor de la queryKey, react-query vuelve a pedir los datos.
  const productosQ = useQuery({
    queryKey: ['catalogo', { textoFinal, categoria, ordenar, soloDisponibles, pagina }],
    queryFn: () =>
      catalogoService.buscar({
        pagina,
        tamanoPagina: 12,
        texto: textoFinal || undefined,
        categoria,
        ordenar,
        soloDisponibles: soloDisponibles || undefined,
      }),
    placeholderData: keepPreviousData, // mantiene la lista anterior mientras llega la nueva
  });

  const resultado = productosQ.data;

  return (
    <section>
      <h1>Catálogo</h1>

      <div>
        <input
          type="search"
          placeholder="Buscar productos…"
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setPagina(1); }}
        />

        <select
          value={categoria ?? ''}
          onChange={(e) => { setCategoria(e.target.value ? Number(e.target.value) : undefined); setPagina(1); }}
        >
          <option value="">Todas las categorías</option>
          {categoriasQ.data?.map((c) => (
            <option key={c.IDCategoria} value={c.IDCategoria}>{c.NombreCategoria}</option>
          ))}
        </select>

        <select
          value={ordenar}
          onChange={(e) => { setOrdenar(e.target.value as OrdenCatalogo); setPagina(1); }}
        >
          {ORDEN_CATALOGO.map((o) => (
            <option key={o} value={o}>{ETIQUETA_ORDEN[o]}</option>
          ))}
        </select>

      
      </div>

      {productosQ.isLoading && <p>Cargando productos…</p>}

      {productosQ.isError && (
        <p role="alert">
          No se pudieron cargar los productos.{' '}
          <button onClick={() => productosQ.refetch()}>Reintentar</button>
        </p>
      )}

      {resultado && resultado.datos.length === 0 && <p>No hay productos que coincidan con la búsqueda.</p>}

      {resultado && resultado.datos.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {resultado.datos.map((p) => (
              <TarjetaProducto key={p.IDProducto} producto={p} />
            ))}
          </div>

          <nav>
            <button disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
            <span> Página {resultado.pagina} de {resultado.totalPaginas} ({resultado.total} productos) </span>
            <button disabled={pagina >= resultado.totalPaginas} onClick={() => setPagina((p) => p + 1)}>Siguiente</button>
          </nav>
        </>
      )}
    </section>
  );
}