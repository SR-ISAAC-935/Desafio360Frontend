export interface EstadoPedido {
  IDEstadoPedido: number;
  NombreEstado: string;
}

/** Fila de "Mis pedidos" (cliente). */
export interface PedidoResumen {
  IDPedido: number;
  Estado: string;
  Total: number;
  FechaPedido: string;
}

/** Fila del listado del personal (incluye al cliente). */
export interface PedidoPersonal extends PedidoResumen {
  IDUsuario: number;
  Cliente: string;
  Email: string;
}

export interface PedidoCabecera {
  IDPedido: number;
  IDUsuario: number;
  Cliente: string;
  Email: string;
  Estado: string;
  Subtotal: number;
  Descuento: number;
  Total: number;
  MontoIVA: number;
  CodigoCupon: string | null;
  FechaPedido: string;
  DireccionEntrega: string;
}

export interface LineaPedido {
  IDPedidoDetalle: number;
  SKU: string;
  NombreProducto: string;
  Talla: string | null;
  Color: string | null;
  Cantidad: number;
  PrecioUnitario: number;
  DescuentoLinea: number;
  TotalLinea: number;
  CantidadDevuelta: number;
}

export interface HistorialPedido {
  FechaCambio: string;
  EstadoAnterior: string | null;
  EstadoNuevo: string;
  Usuario: string;
  Comentario: string | null;
}

export interface PagoPedido {
  IDPago: number;
  Monto: number;
  Metodo: string;
  Estado: string;
  Referencia: string | null;
  FechaPago: string;
}

export interface DetallePedido {
  pedido: PedidoCabecera;
  lineas: LineaPedido[];
  historial: HistorialPedido[];
  pagos: PagoPedido[];
}

export const ORDEN_PEDIDOS = ['FECHA_DESC', 'FECHA_ASC', 'TOTAL_DESC', 'TOTAL_ASC'] as const;
export type OrdenPedidos = (typeof ORDEN_PEDIDOS)[number];

export const ESTADOS_AVANZABLES = ['En preparación', 'Despachado', 'Entregado'] as const;
export type EstadoAvanzable = (typeof ESTADOS_AVANZABLES)[number];

/*
 * Espejo de la tabla TransicionesEstadoPedido, solo para mostrar al usuario las acciones que tienen sentido.
 * La regla real la valida la base de datos (trigger) y el servidor responde 409 si la transición no es válida.
 */
export const SIGUIENTE_ESTADO: Partial<Record<string, EstadoAvanzable>> = {
  Pagado: 'En preparación',
  'En preparación': 'Despachado',
  Despachado: 'Entregado',
};
export const ESTADOS_CANCELABLES = ['Pendiente de pago', 'Pagado', 'En preparación'];
export const ESTADOS_DEVOLVIBLES = ['Entregado', 'Devuelto parcial'];
