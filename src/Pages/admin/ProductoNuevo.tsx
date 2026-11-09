import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Campo } from '../../Components/Campo';
import { MensajeError } from '../../Components/MensajeError';
import { SubirImagen } from '../../Components/SubirImagen';
import { productoNuevoSchema, type ProductoNuevoForm } from '../../schemas/admin.schemas';
import { categoriasAdmin, productosAdmin } from '../../services/admin.services';
import { opcional } from '../../utils/formato';

const VARIANTE_VACIA = { sku: '', talla: '', color: '', precio: 0, existenciaInicial: 0, imagenUrl: '' };

export function ProductoNuevo() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const categoriasQ = useQuery({ queryKey: ['categorias-admin'], queryFn: categoriasAdmin.listar });

  const { register, control, handleSubmit, formState: { errors } } = useForm<ProductoNuevoForm>({
    resolver: zodResolver(productoNuevoSchema),
    defaultValues: { nombreProducto: '', descripcion: '', variantes: [VARIANTE_VACIA] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'variantes' });

  const crear = useMutation({
    mutationFn: (d: ProductoNuevoForm) =>
      productosAdmin.crear({
        nombreProducto: d.nombreProducto,
        idCategoria: d.idCategoria,
        descripcion: opcional(d.descripcion),
        variantes: d.variantes.map((v) => ({
          sku: v.sku,
          precio: v.precio,
          existenciaInicial: v.existenciaInicial,
          talla: opcional(v.talla),
          color: opcional(v.color),
          imagenUrl: opcional(v.imagenUrl),
        })),
      }),
    onSuccess: async ({ IDProducto }) => {
      await qc.invalidateQueries({ queryKey: ['productos-admin'] });
      await qc.invalidateQueries({ queryKey: ['catalogo'] });
      void navigate(`/admin/productos/${IDProducto}`);
    },
  });

  return (
    <section>
      <h1>Nuevo producto</h1>
      <form onSubmit={handleSubmit((d) => crear.mutate(d))} noValidate className="formulario">
        <Campo etiqueta="Nombre" error={errors.nombreProducto?.message}>
          <input {...register('nombreProducto')} maxLength={150} />
        </Campo>
        <Campo etiqueta="Categoría" error={errors.idCategoria?.message}>
          <select {...register('idCategoria', { setValueAs: (v: string) => (v ? Number(v) : undefined) })} defaultValue="">
            <option value="">Selecciona…</option>
            {categoriasQ.data?.filter((c) => c.Activo).map((c) => <option key={c.IDCategoria} value={c.IDCategoria}>{c.NombreCategoria}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Descripción (opcional)" error={errors.descripcion?.message}>
          <textarea rows={3} {...register('descripcion')} maxLength={1000} />
        </Campo>

        <h2>Variantes</h2>
        {typeof errors.variantes?.message === 'string' && <p role="alert" className="error">{errors.variantes.message}</p>}
        {typeof errors.variantes?.root?.message === 'string' && <p role="alert" className="error">{errors.variantes.root.message}</p>}

        {fields.map((campo, i) => {
          const e = errors.variantes?.[i];
          return (
            <fieldset key={campo.id} className="panel">
              <legend>Variante {i + 1}</legend>
              <Campo etiqueta="SKU" error={e?.sku?.message}><input {...register(`variantes.${i}.sku`)} maxLength={50} /></Campo>
              <Campo etiqueta="Talla (opcional)" error={e?.talla?.message}><input {...register(`variantes.${i}.talla`)} maxLength={30} /></Campo>
              <Campo etiqueta="Color (opcional)" error={e?.color?.message}><input {...register(`variantes.${i}.color`)} maxLength={30} /></Campo>
              <Campo etiqueta="Precio (Q)" error={e?.precio?.message}>
                <input type="number" step="0.01" {...register(`variantes.${i}.precio`, { valueAsNumber: true })} />
              </Campo>
              <Campo etiqueta="Existencia inicial" error={e?.existenciaInicial?.message}>
                <input type="number" step={1} {...register(`variantes.${i}.existenciaInicial`, { valueAsNumber: true })} />
              </Campo>
              <div>
                <span>Imagen (opcional)</span>
                <Controller
                  control={control}
                  name={`variantes.${i}.imagenUrl`}
                  render={({ field }) => <SubirImagen valor={field.value} onCambio={field.onChange} />}
                />
                {e?.imagenUrl?.message && <small role="alert" className="error-campo">{e.imagenUrl.message}</small>}
              </div>
              {fields.length > 1 && <button type="button" onClick={() => remove(i)}>Quitar variante</button>}
            </fieldset>
          );
        })}

        <button type="button" onClick={() => append(VARIANTE_VACIA)} disabled={fields.length >= 50}>Agregar variante</button>

        <MensajeError error={crear.error} />
        <div className="botones">
          <button type="submit" disabled={crear.isPending}>{crear.isPending ? 'Creando…' : 'Crear producto'}</button>
          <button type="button" onClick={() => void navigate('/admin/productos')}>Cancelar</button>
        </div>
      </form>
    </section>
  );
}
