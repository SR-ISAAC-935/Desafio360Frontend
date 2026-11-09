import { api } from '../Tipos/api/cliente';
import type { Categoria, DetalleProducto, FiltrosCatalogo, Pagina, ProductoCard } from '../Tipos/catalogo';

export const catalogoService = {
  async buscar(f: FiltrosCatalogo): Promise<Pagina<ProductoCard>> {
    // Solo se envían los filtros con valor: el backend rechaza cadenas vacías en los números.
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== ''));
    const { data } = await api.get<Pagina<ProductoCard>>('/catalogo/productos', { params });
    return data;
  },

  async categorias(): Promise<Categoria[]> {
    const { data } = await api.get<Categoria[]>('/catalogo/categorias');
    return data;
  },

  async detallepublico(id: number): Promise<DetalleProducto> {
    const { data } = await api.get<DetalleProducto>(`/catalogo/productos/${id}`);
    return data;
  },
};
