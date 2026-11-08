import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sesion } from '../Tipos/api/sesion';
import { carritoService } from '../services/carrito.services';
import type { CarritoCompleto } from '../Tipos/carrito';
import { useAuth } from './useAuth';

function useClave() {
  const { usuario } = useAuth();
  return ['carrito', usuario?.IDUsuario ?? 'invitado'];
}

export function useCarrito() {
  const { usuario } = useAuth();
  const clave = useClave();
  const esCliente = usuario?.NombreRol === 'Cliente';
  const invitadoConCarrito = !usuario && sesion.getCarritoToken() !== null;
  return useQuery({
    queryKey: clave,
    queryFn: carritoService.ver,
    enabled: esCliente || invitadoConCarrito, // un invitado sin token no consulta
  });
}

export function useCarritoAcciones() {
  const qc = useQueryClient();
  const clave = useClave();
  const alTerminar = (c: CarritoCompleto) => qc.setQueryData(clave, c);

  return {
    agregar: useMutation({
      mutationFn: (p: { idVariante: number; cantidad: number }) => carritoService.agregar(p.idVariante, p.cantidad),
      onSuccess: alTerminar,
    }),
    cambiarCantidad: useMutation({
      mutationFn: (p: { idVariante: number; cantidad: number }) => carritoService.cambiarCantidad(p.idVariante, p.cantidad),
      onSuccess: alTerminar,
    }),
    quitar: useMutation({
      mutationFn: (idVariante: number) => carritoService.quitar(idVariante),
      onSuccess: alTerminar,
    }),
  };
}