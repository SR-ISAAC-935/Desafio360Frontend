import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { direccionSchema, type DireccionForm } from '../schemas/checkout.schemas';
import { direccionesService } from '../services/checkout.services';
import { opcional } from '../utils/formato';
import { Campo } from './Campo';
import { EstadoConsulta } from './EstadoConsulta';
import { MensajeError } from './MensajeError';

interface Props {
  seleccionada: number | null;
  onSeleccion: (id: number | null) => void;
  deshabilitado?: boolean;
}

function NuevaDireccion({ alCrear, alCancelar }: { alCrear: (id: number) => void; alCancelar: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<DireccionForm>({
    resolver: zodResolver(direccionSchema),
    defaultValues: { direccion: '', zona: '', municipio: '', departamento: '', referencia: '', codigoPostal: '' },
  });
  const crear = useMutation({
    mutationFn: (d: DireccionForm) =>
      direccionesService.crear({
        direccion: d.direccion,
        municipio: d.municipio,
        departamento: d.departamento,
        zona: opcional(d.zona),
        referencia: opcional(d.referencia),
        codigoPostal: opcional(d.codigoPostal),
      }),
    onSuccess: async ({ IDDireccion }) => {
      await qc.invalidateQueries({ queryKey: ['direcciones'] });
      alCrear(IDDireccion);
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => crear.mutate(d))} noValidate className="panel formulario">
      <h3>Nueva dirección</h3>
      <Campo etiqueta="Dirección" error={errors.direccion?.message}><input {...register('direccion')} maxLength={200} /></Campo>
      <Campo etiqueta="Zona (opcional)" error={errors.zona?.message}><input {...register('zona')} maxLength={10} /></Campo>
      <Campo etiqueta="Municipio" error={errors.municipio?.message}><input {...register('municipio')} maxLength={100} /></Campo>
      <Campo etiqueta="Departamento" error={errors.departamento?.message}><input {...register('departamento')} maxLength={100} /></Campo>
      <Campo etiqueta="Referencia (opcional)" error={errors.referencia?.message}><input {...register('referencia')} maxLength={255} /></Campo>
      <Campo etiqueta="Código postal (opcional)" error={errors.codigoPostal?.message}><input {...register('codigoPostal')} maxLength={10} /></Campo>
      <MensajeError error={crear.error} />
      <div className="botones">
        <button type="submit" disabled={crear.isPending}>{crear.isPending ? 'Guardando…' : 'Guardar dirección'}</button>
        <button type="button" onClick={alCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

/** Lista las direcciones del cliente para elegir una, y permite agregar o quitar. */
export function Direcciones({ seleccionada, onSeleccion, deshabilitado = false }: Props) {
  const qc = useQueryClient();
  const [agregando, setAgregando] = useState(false);
  const consulta = useQuery({ queryKey: ['direcciones'], queryFn: direccionesService.listar });

  const quitar = useMutation({
    mutationFn: direccionesService.desactivar,
    onSuccess: async (_, id) => {
      if (seleccionada === id) onSeleccion(null);
      await qc.invalidateQueries({ queryKey: ['direcciones'] });
    },
  });

  return (
    <fieldset className="panel" disabled={deshabilitado}>
      <legend>Dirección de entrega</legend>
      <EstadoConsulta
        cargando={consulta.isLoading}
        hayError={consulta.isError}
        error={consulta.error}
        vacio={consulta.data?.length === 0 && !agregando}
        mensajeVacio="Aún no tienes direcciones. Agrega una para continuar."
        reintentar={() => void consulta.refetch()}
      >
        {consulta.data?.map((d) => (
          <div key={d.IDDireccion} className="accion">
            <label>
              <input type="radio" name="direccion" checked={seleccionada === d.IDDireccion} onChange={() => onSeleccion(d.IDDireccion)} />{' '}
              {d.Direccion}{d.Zona ? `, zona ${d.Zona}` : ''}, {d.Municipio}, {d.Departamento}
              {d.Referencia ? <small> · {d.Referencia}</small> : null}
            </label>
            <button type="button" disabled={quitar.isPending} onClick={() => quitar.mutate(d.IDDireccion)}>Quitar</button>
          </div>
        ))}
      </EstadoConsulta>
      <MensajeError error={quitar.error} />

      {agregando ? (
        <NuevaDireccion alCrear={(id) => { onSeleccion(id); setAgregando(false); }} alCancelar={() => setAgregando(false)} />
      ) : (
        <button type="button" onClick={() => setAgregando(true)}>Agregar dirección</button>
      )}
    </fieldset>
  );
}
