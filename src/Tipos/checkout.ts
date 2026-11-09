export interface Direccion {
  IDDireccion: number;
  Direccion: string;
  Zona: string | null;
  Municipio: string;
  Departamento: string;
  Referencia: string | null;
  CodigoPostal: string | null;
}

export const METODOS_PAGO = ['TARJETA', 'TRANSFERENCIA'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export interface Reserva {
  reservas: { IDReserva: number; SKU: string; Cantidad: number; FechaVencimiento: string }[];
  venceEn: string | null;
}

export interface PedidoCreado {
  idPedido: number;
  /** true si la llave de idempotencia ya existía: el servidor devolvió el pedido anterior sin cobrar de nuevo. */
  repetido: boolean;
}
