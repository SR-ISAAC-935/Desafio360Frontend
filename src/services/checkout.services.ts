import { api } from '../Tipos/api/cliente';
import type { Direccion, MetodoPago, PedidoCreado, Reserva } from '../Tipos/checkout';

export const checkoutService = {
  /** Paso 1: reserva la existencia del carrito por 15 minutos. */
  async reservar() {
    return (await api.post<Reserva>('/checkout/reservar')).data;
  },
  /** Paso 2: crea el pedido. La llave evita pedidos duplicados si se reintenta (doble clic o falla de red). */
  async pagar(datos: { idDireccion: number; llaveIdempotencia: string; metodoPago: MetodoPago }) {
    return (await api.post<PedidoCreado>('/checkout/pagar', datos)).data;
  },
};

export const direccionesService = {
  async listar() {
    return (await api.get<Direccion[]>('/direcciones')).data;
  },
  async crear(datos: {
    direccion: string;
    zona?: string;
    municipio: string;
    departamento: string;
    referencia?: string;
    codigoPostal?: string;
  }) {
    return (await api.post<{ IDDireccion: number }>('/direcciones', datos)).data;
  },
  async desactivar(id: number) {
    await api.delete(`/direcciones/${id}`);
  },
};
