import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, renovarSesion } from '../Tipos/api/cliente';
import { sesion } from '../Tipos/api/sesion';
import { authService } from '../services/auth.services';
import type { Usuario } from '../Tipos/api';
import { AuthContexto } from '../context/auth-context';
import { isAxiosError } from 'axios';
import { carritoService } from '../services/carrito.services';
import { useQueryClient } from '@tanstack/react-query';
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // Solo hay que esperar si existe un refresh token con el que recuperar la sesión.
  const [cargando, setCargando] = useState(() => sesion.getRefresh() !== null);
const qc = useQueryClient();
// ...
useEffect(() => {
  if (!sesion.getRefresh()) return;
  renovarSesion()
    .then(() => api.get<{ usuario: Usuario }>('/auth/yo'))
    .then(({ data }) => setUsuario(data.usuario))
    .catch((e) => {
      // Solo se descarta la sesión si el servidor la rechazó; un fallo de red no debe cerrarla.
      if (isAxiosError(e) && e.response?.status === 401) sesion.limpiar();
    })
    .finally(() => setCargando(false));
}, []);

  useEffect(() => {
    const alExpirar = () => setUsuario(null);
    window.addEventListener('sesion-expirada', alExpirar);
    return () => window.removeEventListener('sesion-expirada', alExpirar);
  }, []);


const login = useCallback(async (email: string, password: string) => {
  setUsuario(await authService.login(email, password));
  if (sesion.getCarritoToken()) {
    try { await carritoService.fusionar(); } catch { /* el carrito de invitado queda intacto */ }
    qc.invalidateQueries({ queryKey: ['carrito'] });
  }
}, [qc]);
  const logout = useCallback(async () => {
    await authService.logout();
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, cargando, login, logout }), [usuario, cargando, login, logout]);
  return <AuthContexto.Provider value={valor}>{children}</AuthContexto.Provider>;
}