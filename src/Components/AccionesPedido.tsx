import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pedidosService } from '../services/pedidos.services';
import { comentarioSchema, devolucionSchema, motivoSchema, type ComentarioForm, type MotivoForm } from '../schemas/pedidos.schemas';
import type { EstadoAvanzable, LineaPedido } from '../Tipos/pedidos';
import { Campo } from './Campo';
import { MensajeError } from './MensajeError';

/** Tras cualquier acción se vuelven a pedir el pedido y los listados que lo muestran. */
function useRefrescarPedido(idPedido: number) {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['pedido', idPedido] }),
      qc.invalidateQueries({ queryKey: ['pedidos'] }),
      qc.invalidateQueries({ queryKey: ['mis-pedidos'] }),
    ]);
}

export function CancelarPedido({ idPedido }: { idPedido: number }) {
  const refrescar = useRefrescarPedido(idPedido);
  const { register, handleSubmit, formState: { errors } } = useForm<MotivoForm>({ resolver: zodResolver(motivoSchema) });
  const cancelar = useMutation({
    mutationFn: (d: MotivoForm) => pedidosService.cancelar(idPedido, d.motivo),
    onSuccess: refrescar,
  });

  return (
    <form onSubmit={handleSubmit((d) => cancelar.mutate(d))} noValidate className="accion">
      <h3>Cancelar pedido</h3>
      <Campo etiqueta="Motivo de la cancelación" error={errors.motivo?.message}>
        <input {...register('motivo')} maxLength={255} />
      </Campo>
      <MensajeError error={cancelar.error} />
      <button type="submit" disabled={cancelar.isPending}>
        {cancelar.isPending ? 'Cancelando…' : 'Cancelar pedido'}
      </button>
    </form>
  );
}

export function AvanzarEstado({ idPedido, siguiente }: { idPedido: number; siguiente: EstadoAvanzable }) {
  const refrescar = useRefrescarPedido(idPedido);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ComentarioForm>({
    resolver: zodResolver(comentarioSchema),
    defaultValues: { comentario: '' },
  });
  const avanzar = useMutation({
    mutationFn: (d: ComentarioForm) => pedidosService.avanzar(idPedido, siguiente, d.comentario),
    onSuccess: async () => { reset(); await refrescar(); },
  });

  return (
    <form onSubmit={handleSubmit((d) => avanzar.mutate(d))} noValidate className="accion">
      <h3>Avanzar estado</h3>
      <Campo etiqueta="Comentario (opcional)" error={errors.comentario?.message}>
        <input {...register('comentario')} maxLength={255} />
      </Campo>
      <MensajeError error={avanzar.error} />
      <button type="submit" disabled={avanzar.isPending}>
        {avanzar.isPending ? 'Guardando…' : `Marcar como «${siguiente}»`}
      </button>
    </form>
  );
}

export function DevolverPedido({ idPedido, lineas }: { idPedido: number; lineas: LineaPedido[] }) {
  const refrescar = useRefrescarPedido(idPedido);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [motivo, setMotivo] = useState('');
  const [errorLocal, setErrorLocal] = useState('');

  const devolver = useMutation({
    mutationFn: (datos: { motivo: string; lineas: { idPedidoDetalle: number; cantidad: number }[] }) =>
      pedidosService.devolver(idPedido, datos.motivo, datos.lineas),
    onSuccess: async () => { setCantidades({}); setMotivo(''); await refrescar(); },
  });

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const seleccion = Object.entries(cantidades)
      .map(([id, cantidad]) => ({ idPedidoDetalle: Number(id), cantidad }))
      .filter((l) => l.cantidad > 0);
    const validado = devolucionSchema.safeParse({ motivo, lineas: seleccion });
    if (!validado.success) {
      setErrorLocal(validado.error.issues[0]?.message ?? 'Datos inválidos.');
      return;
    }
    setErrorLocal('');
    devolver.mutate(validado.data);
  };

  return (
    <form onSubmit={enviar} noValidate className="accion">
      <h3>Registrar devolución</h3>
      <p>Indique cuántas unidades de cada producto se devuelven (puede ser parcial).</p>

      {lineas.map((l) => {
        const maximo = l.Cantidad - l.CantidadDevuelta;
        return (
          <Campo key={l.IDPedidoDetalle} etiqueta={`${l.NombreProducto} (${l.SKU}) — se pueden devolver hasta ${maximo}`}>
            <input
              type="number"
              min={0}
              max={maximo}
              disabled={maximo === 0}
              value={cantidades[l.IDPedidoDetalle] ?? 0}
              onChange={(e) => {
                const n = Math.min(Math.max(Math.trunc(Number(e.target.value)) || 0, 0), maximo);
                setCantidades((prev) => ({ ...prev, [l.IDPedidoDetalle]: n }));
              }}
            />
          </Campo>
        );
      })}

      <Campo etiqueta="Motivo de la devolución">
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} />
      </Campo>

      {errorLocal && <p role="alert" className="error">{errorLocal}</p>}
      <MensajeError error={devolver.error} />
      <button type="submit" disabled={devolver.isPending}>
        {devolver.isPending ? 'Registrando…' : 'Registrar devolución'}
      </button>
    </form>
  );
}
