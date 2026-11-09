import type { Rol } from './api';

export interface Existencia {
  IDVariante: number;
  SKU: string;
  NombreProducto: string;
  NombreCategoria: string;
  Talla: string | null;
  Color: string | null;
  Activo: boolean;
  ExistenciaFisica: number;
  Reservado: number;
  Disponible: number;
}

export interface MovimientoKardex {
  IDMovimiento: number;
  SKU: string;
  TipoMovimiento: string;
  Cantidad: number;
  ExistenciaResultante: number;
  Motivo: string | null;
  FechaMovimiento: string;
  IDPedido: number | null;
  Usuario: string;
}

export interface DiferenciaKardex {
  IDVariante: number;
  SKU: string;
  ExistenciaFisica: number;
  SumaKardex: number;
}

export interface Cupon {
  IDCupon: number;
  Codigo: string;
  Descripcion: string | null;
  Tipo: 'PORCENTAJE' | 'MONTO_FIJO';
  Valor: number;
  FechaInicio: string;
  FechaFin: string;
  MontoMinimo: number;
  LimiteUsosTotal: number;
  UsosActuales: number;
  LimiteUsosPorCliente: number;
  IDCategoria: number | null;
  NombreCategoria: string | null;
  Activo: boolean;
}

export interface UsuarioFila {
  IDUsuario: number;
  Email: string;
  NombreCompleto: string;
  NombreRol: Rol;
  Activo: boolean;
  FechaCreacion: string;
}

export interface BitacoraFila {
  IDBitacora: number;
  FechaHora: string;
  Usuario: string;
  Modulo: string;
  Entidad: string;
  IDEntidad: string;
  Accion: string;
  ValorAnterior: string | null;
  ValorNuevo: string | null;
}

export const MODULOS_BITACORA = ['Productos', 'Precios', 'Inventario', 'Cupones', 'Pedidos', 'Usuarios'] as const;

export interface VentaPeriodo {
  Periodo: string;
  NumeroPedidos: number;
  TotalVendido: number;
  TicketPromedio: number;
}

export interface VentaCategoria {
  IDCategoria: number;
  NombreCategoria: string;
  UnidadesVendidas: number;
  TotalVendido: number;
}

export interface TopProducto {
  IDProducto: number;
  NombreProducto: string;
  UnidadesVendidas: number;
  TotalVendido: number;
}

export interface ResumenReporte {
  indicadores?: {
    NumeroPedidos: number;
    TotalVendido: number;
    TotalDevuelto: number;
    TicketPromedio: number;
  };
  carritosAbandonados: number;
}

export interface CarritoAbandonado {
  IDCarrito: number;
  Cliente: string | null;
  Email: string | null;
  FechaUltimaActividad: string;
  Productos: number;
  ValorCarrito: number;
}

export interface FirmaImagen {
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
  expiraEnSegundos: number;
}
