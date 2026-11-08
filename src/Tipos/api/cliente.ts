import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { sesion } from './sesion';


export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = sesion.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Rutas donde un 401 NO significa "token vencido" (p. ej. credenciales incorrectas).
const SIN_RENOVACION = ['/auth/login', '/auth/registro', '/auth/refresh', '/auth/logout'];

// Una sola renovación a la vez: si varias peticiones fallan juntas, comparten esta promesa.
let renovando: Promise<string> | null = null;

async function renovar(): Promise<string> {
  const refreshToken = sesion.getRefresh();
  if (!refreshToken) throw new Error('Sin refresh token');
  const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, { refreshToken });
  sesion.setAccess(data.accessToken);
  sesion.setRefresh(data.refreshToken);
  return data.accessToken;
}
api.interceptors.request.use((config) => {
  const token = sesion.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const carrito = sesion.getCarritoToken();
  if (carrito) config.headers['x-carrito-token'] = carrito;

  return config;
});
api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as (InternalAxiosRequestConfig & { _reintentada?: boolean }) | undefined;
    const sinRenovar = SIN_RENOVACION.includes(original?.url ?? '');
    if (err.response?.status !== 401 || !original || original._reintentada || sinRenovar) throw err;

    original._reintentada = true;
 try {
  const nuevo = await renovarSesion();
  original.headers.Authorization = `Bearer ${nuevo}`;
  return api(original);
} catch {
      sesion.limpiar();
      window.dispatchEvent(new Event('sesion-expirada'));
      throw err;
    }
  },
);
export function renovarSesion(): Promise<string> {
  renovando ??= renovar().finally(() => { renovando = null; });
  return renovando;
}