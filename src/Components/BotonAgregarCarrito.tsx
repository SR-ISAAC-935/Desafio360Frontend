import { useAuth } from '../hooks/useAuth';
import { useCarritoAcciones } from '../hooks/useCarrito';
import { mensajeError } from '../utils/errores';
import type { Variante } from '../Tipos/catalogo';

export function BotonAgregarCarrito({ variante }: { variante: Variante }) {
  const { usuario } = useAuth();
  const { agregar } = useCarritoAcciones();

  // Operador y Administrador no compran: no se muestra nada.
  const puedeComprar = !usuario || usuario.NombreRol === 'Cliente';
  if (!puedeComprar) return null;

  return (
    <div>
      <button
        disabled={variante.Disponible === 0 || agregar.isPending}
        onClick={() => agregar.mutate({ idVariante: variante.IDVariante, cantidad: 1 })}
      >
        {agregar.isPending ? 'Agregando…' : 'Agregar al carrito'}
      </button>
      {agregar.isSuccess && <p>Agregado al carrito.</p>}
      {agregar.isError && <p role="alert">{mensajeError(agregar.error)}</p>}
    </div>
  );
}
