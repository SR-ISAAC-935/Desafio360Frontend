export interface LineaCarrito {
  IDVariante: number;
  SKU: string;
  NombreProducto: string;
  Talla: string | null;
  Color: string | null;
  ImagenUrl: string | null;
  Cantidad: number;
  PrecioUnitario: number;
  TotalLinea: number;
  Disponible: number;
  SinExistencia: boolean | number;
}

export interface CarritoCompleto {
  carrito: { IDCarrito: number; Estado: string; IDCupon: number | null; CodigoCupon: string | null; CuponValido: boolean | number };
  lineas: LineaCarrito[];
  totales: { Subtotal: number; Descuento: number; Total: number; IVAIncluido: number };
  tokenInvitado: string | null;
}