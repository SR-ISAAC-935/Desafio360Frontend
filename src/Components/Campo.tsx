import type { ReactNode } from 'react';

/** Etiqueta + control + mensaje de error de validación. */
export function Campo({ etiqueta, error, children }: { etiqueta: string; error?: string; children: ReactNode }) {
  return (
    <label className="campo">
      <span>{etiqueta}</span>
      {children}
      {error && <small role="alert" className="error-campo">{error}</small>}
    </label>
  );
}
