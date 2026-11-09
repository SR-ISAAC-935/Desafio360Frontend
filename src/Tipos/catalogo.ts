export const ORDEN_CATALOGO = ['NOMBRE_ASC', 'NOMBRE_DESC', 'PRECIO_ASC', 'PRECIO_DESC'] as const;
export type OrdenCatalogo = (typeof ORDEN_CATALOGO)[number];

export interface ProductoCard {
  IDProducto: number;
  NombreProducto: string;
  Descripcion: string | null;
  IDCategoria: number;
  NombreCategoria: string;
  PrecioMin: number;
  PrecioMax: number;
  Disponible: number;
  ImagenUrl: string | null;
}

export interface Categoria {
  IDCategoria: number;
  NombreCategoria: string;
  Descripcion: string | null;
  Activo: boolean;
}

export interface Pagina<T> {
  datos: T[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export interface FiltrosCatalogo {
  pagina: number;
  tamanoPagina: number;
  texto?: string;
  categoria?: number;
  precioMin?: number;
  precioMax?: number;
  soloDisponibles?: boolean;
  ordenar: OrdenCatalogo;
}

export interface ProductoDetalle {
  IDProducto: number;
  NombreProducto: string;
  Descripcion: string | null;
  IDCategoria: number;
  NombreCategoria: string;
  Activo: boolean;
}

export interface Variante {
  IDVariante: number;
  SKU: string;
  Talla: string | null;
  Color: string | null;
  Precio: number;
  ImagenUrl: string | null;
  Activo: boolean;
  Disponible: number;
}

export interface DetalleProducto {
  producto: ProductoDetalle;
  variantes: Variante[];
}
