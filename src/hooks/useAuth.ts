import { useContext } from 'react';
import { AuthContexto, type AuthCtx } from '../context/auth-context';

export function useAuth(): AuthCtx {
  const c = useContext(AuthContexto);
  if (!c) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return c;
}
