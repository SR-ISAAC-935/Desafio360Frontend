import { api } from '../Tipos/api/cliente';
import { sesion } from '../Tipos/api/sesion';
import type { Sesion, Usuario } from '../Tipos/api';

export const authService = {
  async login(email: string, password: string): Promise<Usuario> {
    const { data } = await api.post<Sesion>('/auth/login', { email, password });
    sesion.setAccess(data.accessToken);
    sesion.setRefresh(data.refreshToken);
    return data.usuario;
  },

  async registro(nombreCompleto: string, email: string, password: string) {
    const { data } = await api.post('/auth/registro', { nombreCompleto, email, password });
    return data.usuario;
  },

  async logout(): Promise<void> {
    const refreshToken = sesion.getRefresh();
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } finally {
      sesion.limpiar();
    }
  },
};
