import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Campo } from '../../Components/Campo';
import { MensajeError } from '../../Components/MensajeError';
import { TablaPaginada, type Columna } from '../../Components/TablaPaginada';
import { useDebounce } from '../../hooks/useDebounce';
import { cuponAdminSchema, type CuponAdminForm } from '../../schemas/admin.schemas';
import { categoriasAdmin, cuponesAdmin } from '../../services/admin.services';
import type { Cupon } from '../../Tipos/admin';
import { fechaGT, hoyISO, q } from '../../utils/formato';

/** El backend entrega instantes UTC; el <input type="date"> necesita el día calendario en Guatemala. */
const aFechaInput = fechaGT;

function FormularioCupon({ cupon, alTerminar }: { cupon: Cupon | null; alTerminar: () => void }) {
  const qc = useQueryClient();
  const categoriasQ = useQuery({ queryKey: ['categorias-admin'], queryFn: categoriasAdmin.listar });
  const [activo, setActivo] = useState(cupon?.Activo ?? true);

  const { register, handleSubmit, control, formState: { errors } } = useForm<CuponAdminForm>({
    resolver: zodResolver(cuponAdminSchema),
    defaultValues: cupon
      ? {
          codigo: cupon.Codigo,
          descripcion: cupon.Descripcion ?? '',
          tipo: cupon.Tipo,
          valor: cupon.Valor,
          fechaInicio: aFechaInput(cupon.FechaInicio),
          fechaFin: aFechaInput(cupon.FechaFin),
          montoMinimo: cupon.MontoMinimo,
          limiteUsosTotal: cupon.LimiteUsosTotal,
          limiteUsosPorCliente: cupon.LimiteUsosPorCliente,
          idCategoria: cupon.IDCategoria ?? undefined,
        }
      : { tipo: 'PORCENTAJE', fechaInicio: hoyISO(), montoMinimo: 0, limiteUsosTotal: 100, limiteUsosPorCliente: 1 },
  });

  const guardar = useMutation({
    mutationFn: async (d: CuponAdminForm) => {
      const { codigo, ...resto } = d;
      const datos = { ...resto, descripcion: d.descripcion || null, idCategoria: d.idCategoria ?? null };
      if (cupon) await cuponesAdmin.actualizar(cupon.IDCupon, { ...datos, activo });
      else await cuponesAdmin.crear({ ...datos, codigo });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['cupones'] });
      alTerminar();
    },
  });

  const tipo = useWatch({ control, name: 'tipo' });

  return (
    <form onSubmit={handleSubmit((d) => guardar.mutate(d))} noValidate className="panel formulario">
      <h2>{cupon ? `Editar cupón ${cupon.Codigo}` : 'Nuevo cupón'}</h2>

      <Campo etiqueta="Código" error={errors.codigo?.message}>
        <input {...register('codigo')} maxLength={50} disabled={Boolean(cupon)} />
      </Campo>
      <Campo etiqueta="Descripción (opcional)" error={errors.descripcion?.message}>
        <input {...register('descripcion')} maxLength={255} />
      </Campo>
      <Campo etiqueta="Tipo" error={errors.tipo?.message}>
        <select {...register('tipo')}>
          <option value="PORCENTAJE">Porcentaje (%)</option>
          <option value="MONTO_FIJO">Monto fijo (Q)</option>
        </select>
      </Campo>
      <Campo etiqueta={tipo === 'PORCENTAJE' ? 'Valor (%)' : 'Valor (Q)'} error={errors.valor?.message}>
        <input type="number" step="0.01" {...register('valor', { valueAsNumber: true })} />
      </Campo>
      <Campo etiqueta="Vigente desde" error={errors.fechaInicio?.message}>
        <input type="date" {...register('fechaInicio')} />
      </Campo>
      <Campo etiqueta="Vigente hasta (inclusive)" error={errors.fechaFin?.message}>
        <input type="date" {...register('fechaFin')} />
      </Campo>
      <Campo etiqueta="Compra mínima (Q)" error={errors.montoMinimo?.message}>
        <input type="number" step="0.01" {...register('montoMinimo', { valueAsNumber: true })} />
      </Campo>
      <Campo etiqueta="Usos totales permitidos" error={errors.limiteUsosTotal?.message}>
        <input type="number" step={1} {...register('limiteUsosTotal', { valueAsNumber: true })} />
      </Campo>
      <Campo etiqueta="Usos por cliente" error={errors.limiteUsosPorCliente?.message}>
        <input type="number" step={1} {...register('limiteUsosPorCliente', { valueAsNumber: true })} />
      </Campo>
      <Campo etiqueta="Solo para una categoría (opcional)" error={errors.idCategoria?.message}>
        <select {...register('idCategoria', { setValueAs: (v: string) => (v ? Number(v) : undefined) })}>
          <option value="">Todas las categorías</option>
          {categoriasQ.data?.map((c) => <option key={c.IDCategoria} value={c.IDCategoria}>{c.NombreCategoria}</option>)}
        </select>
      </Campo>
      {cupon && (
        <label>
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} /> Cupón activo
        </label>
      )}

      <MensajeError error={guardar.error} />
      <div className="botones">
        <button type="submit" disabled={guardar.isPending}>{guardar.isPending ? 'Guardando…' : 'Guardar'}</button>
        <button type="button" onClick={alTerminar}>Cancelar</button>
      </div>
    </form>
  );
}

export function Cupones() {
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState<'' | 'true' | 'false'>('');
  const [edicion, setEdicion] = useState<Cupon | null | undefined>(undefined);
  const textoFinal = useDebounce(texto.trim());

  const consulta = useQuery({
    queryKey: ['cupones', { pagina, textoFinal, estado }],
    queryFn: () =>
      cuponesAdmin.listar({ pagina, tamanoPagina: 15, texto: textoFinal || undefined, activo: estado === '' ? undefined : estado === 'true' }),
    placeholderData: keepPreviousData,
  });

  const columnas: Columna<Cupon>[] = [
    { titulo: 'Código', celda: (c) => <strong>{c.Codigo}</strong> },
    { titulo: 'Descuento', celda: (c) => (c.Tipo === 'PORCENTAJE' ? `${c.Valor}%` : q(c.Valor)) },
    { titulo: 'Vigencia', celda: (c) => `${aFechaInput(c.FechaInicio)} → ${aFechaInput(c.FechaFin)}` },
    { titulo: 'Mínimo', celda: (c) => q(c.MontoMinimo) },
    { titulo: 'Usos', celda: (c) => `${c.UsosActuales} / ${c.LimiteUsosTotal}` },
    { titulo: 'Categoría', celda: (c) => c.NombreCategoria ?? 'Todas' },
    { titulo: 'Estado', celda: (c) => (c.Activo ? 'Activo' : 'Inactivo') },
    { titulo: '', celda: (c) => <button type="button" onClick={() => setEdicion(c)}>Editar</button> },
  ];

  return (
    <section>
      <h1>Cupones</h1>
      <button type="button" onClick={() => setEdicion(null)}>Nuevo cupón</button>
      {edicion !== undefined && (
        <FormularioCupon key={edicion?.IDCupon ?? 'nuevo'} cupon={edicion} alTerminar={() => setEdicion(undefined)} />
      )}

      <div className="filtros">
        <input type="search" placeholder="Buscar por código" value={texto} onChange={(e) => { setTexto(e.target.value); setPagina(1); }} />
        <select value={estado} onChange={(e) => { setEstado(e.target.value as '' | 'true' | 'false'); setPagina(1); }}>
          <option value="">Activos e inactivos</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
      </div>

      <TablaPaginada consulta={consulta} columnas={columnas} clave={(c) => c.IDCupon} pagina={pagina} onPagina={setPagina} mensajeVacio="No hay cupones." />
    </section>
  );
}
