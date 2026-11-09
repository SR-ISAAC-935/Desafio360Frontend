import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Campo } from '../../Components/Campo';
import { EstadoConsulta } from '../../Components/EstadoConsulta';
import { MensajeError } from '../../Components/MensajeError';
import { SubirImagen } from '../../Components/SubirImagen';
import {
  precioSchema,
  productoEdicionSchema,
  varianteEdicionSchema,
  varianteSchema,
  type PrecioForm,
  type ProductoEdicionForm,
  type VarianteEdicionForm,
  type VarianteForm,
} from '../../schemas/admin.schemas';
import { categoriasAdmin, productosAdmin } from '../../services/admin.services';
import type { DetalleProducto, Variante } from '../../Tipos/catalogo';
import { opcional, q } from '../../utils/formato';

function useRefrescar(id: number) {
  const qc = useQueryClient();
  return async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['producto-admin', id] }),
      qc.invalidateQueries({ queryKey: ['productos-admin'] }),
      qc.invalidateQueries({ queryKey: ['catalogo'] }),
      qc.invalidateQueries({ queryKey: ['producto'] }),
    ]);
  };
}

function DatosProducto({ detalle }: { detalle: DetalleProducto }) {
  const { producto } = detalle;
  const refrescar = useRefrescar(producto.IDProducto);
  const categoriasQ = useQuery({ queryKey: ['categorias-admin'], queryFn: categoriasAdmin.listar });
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProductoEdicionForm>({
    resolver: zodResolver(productoEdicionSchema),
    defaultValues: {
      nombreProducto: producto.NombreProducto,
      idCategoria: producto.IDCategoria,
      descripcion: producto.Descripcion ?? '',
      activo: producto.Activo,
    },
  });
  const guardar = useMutation({
    mutationFn: (d: ProductoEdicionForm) =>
      productosAdmin.actualizar(producto.IDProducto, { ...d, descripcion: opcional(d.descripcion) ?? null }),
    onSuccess: refrescar,
  });

  return (
    <form onSubmit={handleSubmit((d) => guardar.mutate(d))} noValidate className="panel formulario">
      <h2>Datos del producto</h2>
      <Campo etiqueta="Nombre" error={errors.nombreProducto?.message}><input {...register('nombreProducto')} maxLength={150} /></Campo>
      <Campo etiqueta="Categoría" error={errors.idCategoria?.message}>
        <select {...register('idCategoria', { valueAsNumber: true })}>
          {categoriasQ.data?.map((c) => <option key={c.IDCategoria} value={c.IDCategoria}>{c.NombreCategoria}{c.Activo ? '' : ' (inactiva)'}</option>)}
        </select>
      </Campo>
      <Campo etiqueta="Descripción" error={errors.descripcion?.message}><textarea rows={3} {...register('descripcion')} maxLength={1000} /></Campo>
      <label><input type="checkbox" {...register('activo')} /> Producto activo (visible en el catálogo)</label>
      <MensajeError error={guardar.error} />
      {guardar.isSuccess && !isDirty && <p>Cambios guardados.</p>}
      <button type="submit" disabled={guardar.isPending}>{guardar.isPending ? 'Guardando…' : 'Guardar datos'}</button>
    </form>
  );
}

function FilaVariante({ variante, idProducto }: { variante: Variante; idProducto: number }) {
  const refrescar = useRefrescar(idProducto);

  const datos = useForm<VarianteEdicionForm>({
    resolver: zodResolver(varianteEdicionSchema),
    defaultValues: { talla: variante.Talla ?? '', color: variante.Color ?? '', imagenUrl: variante.ImagenUrl ?? '', activo: variante.Activo },
  });
  const precio = useForm<PrecioForm>({ resolver: zodResolver(precioSchema), defaultValues: { precio: variante.Precio } });

  const guardarDatos = useMutation({
    mutationFn: (d: VarianteEdicionForm) =>
      productosAdmin.actualizarVariante(variante.IDVariante, {
        talla: opcional(d.talla) ?? null,
        color: opcional(d.color) ?? null,
        imagenUrl: opcional(d.imagenUrl) ?? null,
        activo: d.activo,
      }),
    onSuccess: refrescar,
  });
  const guardarPrecio = useMutation({
    mutationFn: (d: PrecioForm) => productosAdmin.cambiarPrecio(variante.IDVariante, d.precio),
    onSuccess: refrescar,
  });

  return (
    <fieldset className="panel">
      <legend>{variante.SKU} · {q(variante.Precio)} · disponible {variante.Disponible}</legend>

      <form onSubmit={datos.handleSubmit((d) => guardarDatos.mutate(d))} noValidate className="formulario">
        <Campo etiqueta="Talla" error={datos.formState.errors.talla?.message}><input {...datos.register('talla')} maxLength={30} /></Campo>
        <Campo etiqueta="Color" error={datos.formState.errors.color?.message}><input {...datos.register('color')} maxLength={30} /></Campo>
        <div>
          <span>Imagen</span>
          <Controller control={datos.control} name="imagenUrl" render={({ field }) => <SubirImagen valor={field.value} onCambio={field.onChange} />} />
          {datos.formState.errors.imagenUrl?.message && <small role="alert" className="error-campo">{datos.formState.errors.imagenUrl.message}</small>}
        </div>
        <label><input type="checkbox" {...datos.register('activo')} /> Variante activa</label>
        <MensajeError error={guardarDatos.error} />
        <button type="submit" disabled={guardarDatos.isPending}>{guardarDatos.isPending ? 'Guardando…' : 'Guardar variante'}</button>
      </form>

      <form onSubmit={precio.handleSubmit((d) => guardarPrecio.mutate(d))} noValidate className="formulario">
        <Campo etiqueta="Nuevo precio (Q)" error={precio.formState.errors.precio?.message}>
          <input type="number" step="0.01" {...precio.register('precio', { valueAsNumber: true })} />
        </Campo>
        <MensajeError error={guardarPrecio.error} />
        <button type="submit" disabled={guardarPrecio.isPending}>{guardarPrecio.isPending ? 'Cambiando…' : 'Cambiar precio'}</button>
        <small>Los carritos y pedidos ya reservados conservan su precio; el cambio queda en la bitácora.</small>
      </form>
    </fieldset>
  );
}

function NuevaVariante({ idProducto }: { idProducto: number }) {
  const refrescar = useRefrescar(idProducto);
  const [abierta, setAbierta] = useState(false);
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<VarianteForm>({
    resolver: zodResolver(varianteSchema),
    defaultValues: { sku: '', talla: '', color: '', precio: 0, existenciaInicial: 0, imagenUrl: '' },
  });
  const crear = useMutation({
    mutationFn: (d: VarianteForm) =>
      productosAdmin.crearVariante(idProducto, {
        sku: d.sku,
        precio: d.precio,
        existenciaInicial: d.existenciaInicial,
        talla: opcional(d.talla),
        color: opcional(d.color),
        imagenUrl: opcional(d.imagenUrl),
      }),
    onSuccess: async () => {
      await refrescar();
      reset();
      setAbierta(false);
    },
  });

  if (!abierta) return <button type="button" onClick={() => setAbierta(true)}>Agregar variante</button>;

  return (
    <form onSubmit={handleSubmit((d) => crear.mutate(d))} noValidate className="panel formulario">
      <h2>Nueva variante</h2>
      <Campo etiqueta="SKU" error={errors.sku?.message}><input {...register('sku')} maxLength={50} /></Campo>
      <Campo etiqueta="Talla" error={errors.talla?.message}><input {...register('talla')} maxLength={30} /></Campo>
      <Campo etiqueta="Color" error={errors.color?.message}><input {...register('color')} maxLength={30} /></Campo>
      <Campo etiqueta="Precio (Q)" error={errors.precio?.message}><input type="number" step="0.01" {...register('precio', { valueAsNumber: true })} /></Campo>
      <Campo etiqueta="Existencia inicial" error={errors.existenciaInicial?.message}><input type="number" step={1} {...register('existenciaInicial', { valueAsNumber: true })} /></Campo>
      <div>
        <span>Imagen</span>
        <Controller control={control} name="imagenUrl" render={({ field }) => <SubirImagen valor={field.value} onCambio={field.onChange} />} />
        {errors.imagenUrl?.message && <small role="alert" className="error-campo">{errors.imagenUrl.message}</small>}
      </div>
      <MensajeError error={crear.error} />
      <div className="botones">
        <button type="submit" disabled={crear.isPending}>{crear.isPending ? 'Creando…' : 'Crear variante'}</button>
        <button type="button" onClick={() => setAbierta(false)}>Cancelar</button>
      </div>
    </form>
  );
}

export function ProductoEditar() {
  const { id } = useParams();
  const idNum = Number(id);
  const valido = Number.isInteger(idNum) && idNum > 0;

  const consulta = useQuery({
    queryKey: ['producto-admin', idNum],
    queryFn: () => productosAdmin.detalle(idNum),
    enabled: valido,
  });

  if (!valido) return <p role="alert" className="error">El identificador del producto no es válido.</p>;

  return (
    <section>
      <p><Link to="/admin/productos">← Productos</Link></p>
      <EstadoConsulta cargando={consulta.isLoading} hayError={consulta.isError} error={consulta.error} reintentar={() => void consulta.refetch()}>
        {consulta.data && (
          <>
            <h1>{consulta.data.producto.NombreProducto}</h1>
            <DatosProducto key={`${consulta.dataUpdatedAt}`} detalle={consulta.data} />
            <h2>Variantes</h2>
            {consulta.data.variantes.map((v) => <FilaVariante key={`${v.IDVariante}-${consulta.dataUpdatedAt}`} variante={v} idProducto={idNum} />)}
            <NuevaVariante idProducto={idNum} />
          </>
        )}
      </EstadoConsulta>
    </section>
  );
}
