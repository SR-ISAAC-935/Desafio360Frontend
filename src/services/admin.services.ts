import axios from 'axios';
import { api } from '../Tipos/api/cliente';
import type {
  BitacoraFila,
  CarritoAbandonado,
  Cupon,
  DiferenciaKardex,
  Existencia,
  FirmaImagen,
  MovimientoKardex,
  ResumenReporte,
  TopProducto,
  UsuarioFila,
  VentaCategoria,
  VentaPeriodo,
} from '../Tipos/admin';
import type { Rol } from '../Tipos/api';
import type { Categoria, DetalleProducto, Pagina } from '../Tipos/catalogo';
import { sinVacios } from '../utils/params';

/* ---------- Productos y variantes ---------- */
export interface VarianteNueva {
  sku: string;
  precio: number;
  existenciaInicial: number;
  talla?: string;
  color?: string;
  imagenUrl?: string;
}
export interface ProductoNuevo {
  nombreProducto: string;
  idCategoria: number;
  descripcion?: string;
  variantes: VarianteNueva[];
}

export const productosAdmin = {
  async detalle(id: number) {
    return (await api.get<DetalleProducto>(`/productos/${id}`)).data;
  },
  async crear(datos: ProductoNuevo) {
    return (await api.post<{ IDProducto: number }>('/productos', datos)).data;
  },
  async actualizar(id: number, datos: { nombreProducto: string; idCategoria: number; descripcion?: string | null; activo: boolean }) {
    await api.put(`/productos/${id}`, datos);
  },
  async crearVariante(idProducto: number, datos: VarianteNueva) {
    return (await api.post<{ IDVariante: number }>(`/productos/${idProducto}/variantes`, datos)).data;
  },
  async actualizarVariante(id: number, datos: { talla?: string | null; color?: string | null; imagenUrl?: string | null; activo: boolean }) {
    await api.put(`/variantes/${id}`, datos);
  },
  async cambiarPrecio(id: number, precio: number) {
    await api.patch(`/variantes/${id}/precio`, { precio });
  },
};

/* ---------- Imágenes (Cloudinary, subida firmada directa desde el navegador) ---------- */
export const imagenesAdmin = {
  /** 1) El backend firma los parámetros; 2) el navegador sube el archivo directo a Cloudinary; 3) se guarda la URL segura. */
  async subir(archivo: File): Promise<string> {
    const { data: firma } = await api.post<FirmaImagen>('/imagenes/firma');
    const cuerpo = new FormData();
    cuerpo.append('file', archivo);
    cuerpo.append('api_key', firma.apiKey);
    cuerpo.append('timestamp', String(firma.timestamp));
    cuerpo.append('folder', firma.folder);
    cuerpo.append('allowed_formats', firma.allowedFormats);
    cuerpo.append('signature', firma.signature);
    // Petición directa a Cloudinary: se usa axios sin el cliente de la API para no enviar nuestros tokens a un tercero.
    const { data } = await axios.post<{ secure_url: string }>(firma.uploadUrl, cuerpo);
    return data.secure_url;
  },
};

/* ---------- Categorías ---------- */
export const categoriasAdmin = {
  async listar() {
    return (await api.get<Categoria[]>('/categorias')).data;
  },
  async crear(datos: { nombreCategoria: string; descripcion?: string }) {
    return (await api.post<{ IDCategoria: number }>('/categorias', datos)).data;
  },
  async actualizar(id: number, datos: { nombreCategoria: string; descripcion?: string | null; activo: boolean }) {
    await api.put(`/categorias/${id}`, datos);
  },
};

/* ---------- Inventario ---------- */
export const inventarioAdmin = {
  async existencias(f: { pagina: number; tamanoPagina: number; texto?: string; categoria?: number }) {
    return (await api.get<Pagina<Existencia>>('/inventario/existencias', { params: sinVacios(f) })).data;
  },
  async kardex(idVariante: number, f: { pagina: number; tamanoPagina: number; desde?: string; hasta?: string }) {
    return (await api.get<Pagina<MovimientoKardex>>(`/inventario/variantes/${idVariante}/kardex`, { params: sinVacios(f) })).data;
  },
  async ajustar(datos: { idVariante: number; tipo: 'ENTRADA' | 'AJUSTE'; cantidad: number; motivo: string }) {
    return (await api.post('/inventario/ajustes', datos)).data;
  },
  async verificar() {
    return (await api.get<{ coincide: boolean; diferencias: DiferenciaKardex[] }>('/inventario/verificar')).data;
  },
  async liberarReservas() {
    return (await api.post<{ reservasLiberadas: number }>('/inventario/liberar-reservas')).data;
  },
};

/* ---------- Cupones ---------- */
export interface DatosCupon {
  descripcion?: string | null;
  tipo: 'PORCENTAJE' | 'MONTO_FIJO';
  valor: number;
  fechaInicio: string;
  fechaFin: string;
  montoMinimo: number;
  limiteUsosTotal: number;
  limiteUsosPorCliente: number;
  idCategoria?: number | null;
}

export const cuponesAdmin = {
  async listar(f: { pagina: number; tamanoPagina: number; texto?: string; activo?: boolean }) {
    return (await api.get<Pagina<Cupon>>('/cupones', { params: sinVacios(f) })).data;
  },
  async crear(datos: DatosCupon & { codigo: string }) {
    return (await api.post<{ IDCupon: number }>('/cupones', datos)).data;
  },
  async actualizar(id: number, datos: DatosCupon & { activo: boolean }) {
    await api.put(`/cupones/${id}`, datos);
  },
};

/* ---------- Usuarios ---------- */
export const usuariosAdmin = {
  async listar(f: { pagina: number; tamanoPagina: number; texto?: string; rol?: Rol; activo?: boolean }) {
    return (await api.get<Pagina<UsuarioFila>>('/usuarios', { params: sinVacios(f) })).data;
  },
  async crear(datos: { email: string; nombreCompleto: string; password: string; rol: Rol }) {
    return (await api.post<{ IDUsuario: number }>('/usuarios', datos)).data;
  },
  async cambiarEstado(id: number, activo: boolean) {
    await api.patch(`/usuarios/${id}/estado`, { activo });
  },
};

/* ---------- Bitácora (solo lectura) ---------- */
export const bitacoraAdmin = {
  async listar(f: { pagina: number; tamanoPagina: number; modulo?: string; desde?: string; hasta?: string }) {
    return (await api.get<Pagina<BitacoraFila>>('/bitacora', { params: sinVacios(f) })).data;
  },
};

/* ---------- Reportes ---------- */
export const reportesAdmin = {
  async ventas(f: { desde: string; hasta: string; agrupacion: 'DIA' | 'SEMANA' | 'MES' }) {
    return (await api.get<VentaPeriodo[]>('/reportes/ventas', { params: f })).data;
  },
  async categorias(f: { desde: string; hasta: string }) {
    return (await api.get<VentaCategoria[]>('/reportes/categorias', { params: f })).data;
  },
  async topProductos(f: { desde: string; hasta: string; top: number }) {
    return (await api.get<TopProducto[]>('/reportes/top-productos', { params: f })).data;
  },
  async resumen(f: { desde: string; hasta: string }) {
    return (await api.get<ResumenReporte>('/reportes/resumen', { params: f })).data;
  },
  async carritosAbandonados(f: { pagina: number; tamanoPagina: number; minutosInactividad?: number }) {
    return (await api.get<Pagina<CarritoAbandonado>>('/reportes/carritos-abandonados', { params: sinVacios(f) })).data;
  },
};
