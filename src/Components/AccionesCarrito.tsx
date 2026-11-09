import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { carritoService } from '../services/carrito.services';
import { cuponSchema, type CuponForm } from '../schemas/carrito.schemas';
import type { CarritoCompleto } from '../Tipos/carrito';
import { Campo } from './Campo';
import { MensajeError } from './MensajeError';

/**
 * Cupón y botón "Ir a pagar" del carrito.
 * El cupón solo existe con sesión de Cliente (el límite de usos es por cliente); un invitado debe iniciar sesión para pagar.
 */
export function AccionesCarrito({ carrito }: { carrito: CarritoCompleto }) {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const esCliente = usuario?.NombreRol === 'Cliente';
  const clave = ['carrito', usuario?.IDUsuario ?? 'invitado'];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CuponForm>({ resolver: zodResolver(cuponSchema) });

  const aplicar = useMutation({
    mutationFn: (d: CuponForm) => carritoService.aplicarCupon(d.codigo),
    onSuccess: (c) => { qc.setQueryData(clave, c); reset(); },
  });
  const quitar = useMutation({
    mutationFn: carritoService.quitarCupon,
    onSuccess: (c) => qc.setQueryData(clave, c),
  });

  const codigo = carrito.carrito.CodigoCupon;
  const hayProblemas = carrito.lineas.some((l) => Boolean(l.SinExistencia));

  return (
    <div className="acciones-carrito">
      {esCliente && (
        <div>
          {codigo ? (
            <>
              <p>
                Cupón <strong>{codigo}</strong>{' '}
                {carrito.carrito.CuponValido ? 'aplicado.' : 'no es válido para este carrito (revisa monto mínimo, fechas o categoría).'}
              </p>
              <button type="button" disabled={quitar.isPending} onClick={() => quitar.mutate()}>Quitar cupón</button>
              <MensajeError error={quitar.error} />
            </>
          ) : (
            <form onSubmit={handleSubmit((d) => aplicar.mutate(d))} noValidate>
              <Campo etiqueta="¿Tienes un cupón?" error={errors.codigo?.message}>
                <input {...register('codigo')} placeholder="CÓDIGO" autoCapitalize="characters" />
              </Campo>
              <MensajeError error={aplicar.error} />
              <button type="submit" disabled={aplicar.isPending}>{aplicar.isPending ? 'Aplicando…' : 'Aplicar cupón'}</button>
            </form>
          )}
        </div>
      )}

      {hayProblemas && <p role="alert" className="error">Ajusta o quita los productos sin existencias para continuar.</p>}

      {!usuario && <p>Para pagar necesitas iniciar sesión; tu carrito se conservará.</p>}

      {usuario && !esCliente ? null : hayProblemas ? (
        <button type="button" disabled>Ir a pagar</button>
      ) : (
        <Link
          className="boton"
          to={esCliente ? '/checkout' : '/login'}
          state={esCliente ? undefined : { desde: { pathname: '/checkout' } }}
        >
          Ir a pagar
        </Link>
      )}
    </div>
  );
}
