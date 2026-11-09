import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { TablaPaginada, type Columna } from '../../Components/TablaPaginada';
import { useDebounce } from '../../hooks/useDebounce';
import { catalogoService } from '../../services/catalogo.services';
import type { ProductoCard } from '../../Tipos/catalogo';
import { q } from '../../utils/formato';

const columnas: Columna<ProductoCard>[] = [
  { titulo: 'ID', celda: (p) => p.IDProducto },
  { titulo: 'Producto', celda: (p) => p.NombreProducto },
  { titulo: 'Categoría', celda: (p) => p.NombreCategoria },
  { titulo: 'Precio', celda: (p) => (p.PrecioMin === p.PrecioMax ? q(p.PrecioMin) : `${q(p.PrecioMin)} – ${q(p.PrecioMax)}`) },
  { titulo: 'Disponible', celda: (p) => p.Disponible },
  { titulo: '', celda: (p) => <Link to={`/admin/productos/${p.IDProducto}`}>Editar</Link> },
];

/**
 * Lista de productos ACTIVOS (usa el catálogo público: el backend no tiene un listado administrativo).
 * Para llegar a un producto inactivo se usa "Ir al ID", porque GET /productos/:id sí lo devuelve.
 */
export function Productos() {
  const navigate = useNavigate();
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState('');
  const [id, setId] = useState('');
  const textoFinal = useDebounce(texto.trim());

  const consulta = useQuery({
    queryKey: ['productos-admin', { pagina, textoFinal }],
    queryFn: () => catalogoService.buscar({ pagina, tamanoPagina: 15, texto: textoFinal || undefined, ordenar: 'NOMBRE_ASC' }),
    placeholderData: keepPreviousData,
  });

  const irAlId = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(id);
    if (Number.isInteger(n) && n > 0) void navigate(`/admin/productos/${n}`);
  };

  return (
    <section>
      <h1>Productos</h1>
      <Link to="/admin/productos/nuevo">Nuevo producto</Link>

      <div className="filtros">
        <input type="search" placeholder="Buscar producto" value={texto} onChange={(e) => { setTexto(e.target.value); setPagina(1); }} />
        <form onSubmit={irAlId}>
          <input type="number" min={1} placeholder="ID (incluye inactivos)" value={id} onChange={(e) => setId(e.target.value)} />
          <button type="submit">Ir al ID</button>
        </form>
      </div>

      <TablaPaginada consulta={consulta} columnas={columnas} clave={(p) => p.IDProducto} pagina={pagina} onPagina={setPagina} mensajeVacio="No hay productos activos." />
    </section>
  );
}
