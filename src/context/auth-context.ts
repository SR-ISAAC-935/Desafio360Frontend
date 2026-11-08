import { createContext } from 'react';
import type { Usuario } from '../Tipos/api';

export interface AuthCtx {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContexto = createContext<AuthCtx | null>(null);