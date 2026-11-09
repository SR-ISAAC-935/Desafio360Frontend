const CLAVE_REFRESH = 'shopcart.refresh';
const CLAVE_CARRITO = 'shopcart.carrito';
let accessToken: string | null = null;

export const sesion = {
  getAccess: () => accessToken,
  setAccess: (t: string | null) => { accessToken = t; },
  getRefresh: () => localStorage.getItem(CLAVE_REFRESH),
  setRefresh: (t: string) => localStorage.setItem(CLAVE_REFRESH, t),
  limpiar: () => { accessToken = null; localStorage.removeItem(CLAVE_REFRESH); },
  getCarritoToken: () => localStorage.getItem(CLAVE_CARRITO),
  setCarritoToken: (t: string) => localStorage.setItem(CLAVE_CARRITO, t),
  limpiarCarritoToken: () => localStorage.removeItem(CLAVE_CARRITO),
};
