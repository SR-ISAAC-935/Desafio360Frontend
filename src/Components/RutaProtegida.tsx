import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Rol } from '../Tipos/api';

export function RutaProtegida({ roles }: { roles?: Rol[] }) {
  const { usuario, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) return <p>Cargando…</p>;
  if (!usuario) return <Navigate to="/login" state={{ desde: ubicacion }} replace />;
  if (roles && !roles.includes(usuario.NombreRol)) return <Navigate to="/no-autorizado" replace />;
  return <Outlet />;
}
