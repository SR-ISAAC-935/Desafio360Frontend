import { api } from '../Tipos/api/cliente';
import { sesion } from '../Tipos/api/sesion';
import type { CarritoCompleto } from '../Tipos/carrito';

// Si la respuesta trae token de invitado, se guarda para las siguientes peticiones.
function conToken(c: CarritoCompleto): CarritoCompleto {
  if (c.tokenInvitado) sesion.setCarritoToken(c.tokenInvitado);
  return c;
}

export const carritoService = {
  async ver() {
    return conToken((await api.get<CarritoCompleto>('/carrito')).data);
  },
  async agregar(idVariante: number, cantidad: number) {
    return conToken((await api.post<CarritoCompleto>('/carrito/items', { idVariante, cantidad })).data);
  },
  async cambiarCantidad(idVariante: number, cantidad: number) {
    return conToken((await api.patch<CarritoCompleto>(`/carrito/items/${idVariante}`, { cantidad })).data);
  },
  async quitar(idVariante: number) {
    return conToken((await api.delete<CarritoCompleto>(`/carrito/items/${idVariante}`)).data);
  },
  async aplicarCupon(codigo: string) {
    return (await api.post<CarritoCompleto>('/carrito/cupon', { codigo })).data;
  },
  async quitarCupon() {
    return (await api.delete<CarritoCompleto>('/carrito/cupon')).data;
  },
  async fusionar() {
    const { data } = await api.post<CarritoCompleto>('/carrito/fusionar');
    sesion.limpiarCarritoToken(); // el carrito de invitado ya pasó al usuario
    return data;
  },
};