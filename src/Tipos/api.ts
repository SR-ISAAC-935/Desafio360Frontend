export type Rol = 'Cliente' | 'Operador' | 'Administrador';

export interface Usuario {
  IDUsuario: number;
  Email: string;
  NombreCompleto: string;
  Activo: boolean;
  IDRol: number;
  NombreRol: Rol;
}

export interface Sesion {
  usuario: Usuario;
  accessToken: string;
  refreshToken: string;
}

export interface ErrorApi {
  error: { codigo: string; mensaje: string; detalles?: unknown };
}
