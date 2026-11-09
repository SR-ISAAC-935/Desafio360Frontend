import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Campo } from '../../Components/Campo';
import { EstadoConsulta } from '../../Components/EstadoConsulta';
import { MensajeError } from '../../Components/MensajeError';
import { categoriaSchema, type CategoriaForm } from '../../schemas/admin.schemas';
import { categoriasAdmin } from '../../services/admin.services';
import type { Categoria } from '../../Tipos/catalogo';

function FormularioCategoria({ categoria, alTerminar }: { categoria: Categoria | null; alTerminar: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<CategoriaForm>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: { nombreCategoria: categoria?.NombreCategoria ?? '', descripcion: categoria?.Descripcion ?? '' },
  });
  const [activo, setActivo] = useState(categoria?.Activo ?? true);

  const guardar = useMutation({
    mutationFn: async (d: CategoriaForm) => {
      if (categoria) {
        await categoriasAdmin.actualizar(categoria.IDCategoria, { ...d, descripcion: d.descripcion || null, activo });
      } else {
        await categoriasAdmin.crear({ nombreCategoria: d.nombreCategoria, descripcion: d.descripcion || undefined });
      }
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['categorias'] }),
        qc.invalidateQueries({ queryKey: ['categorias-admin'] }),
      ]);
      alTerminar();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => guardar.mutate(d))} noValidate className="panel formulario">
      <h2>{categoria ? `Editar categoría #${categoria.IDCategoria}` : 'Nueva categoría'}</h2>
      <Campo etiqueta="Nombre" error={errors.nombreCategoria?.message}>
        <input {...register('nombreCategoria')} maxLength={100} />
      </Campo>
      <Campo etiqueta="Descripción (opcional)" error={errors.descripcion?.message}>
        <textarea rows={2} {...register('descripcion')} maxLength={500} />
      </Campo>
      {categoria && (
        <label>
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} /> Categoría activa
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

export function Categorias() {
  // undefined = formulario cerrado, null = nueva, objeto = editar
  const [edicion, setEdicion] = useState<Categoria | null | undefined>(undefined);
  const consulta = useQuery({ queryKey: ['categorias-admin'], queryFn: categoriasAdmin.listar });

  return (
    <section>
      <h1>Categorías</h1>
      <button type="button" onClick={() => setEdicion(null)}>Nueva categoría</button>

      {edicion !== undefined && (
        <FormularioCategoria key={edicion?.IDCategoria ?? 'nueva'} categoria={edicion} alTerminar={() => setEdicion(undefined)} />
      )}

      <EstadoConsulta
        cargando={consulta.isLoading}
        hayError={consulta.isError}
        error={consulta.error}
        vacio={consulta.data?.length === 0}
        mensajeVacio="Todavía no hay categorías."
        reintentar={() => void consulta.refetch()}
      >
        <div className="tabla-scroll">
          <table>
            <thead><tr><th>Nombre</th><th>Descripción</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {consulta.data?.map((c) => (
                <tr key={c.IDCategoria}>
                  <td data-etiqueta="Nombre">{c.NombreCategoria}</td>
                  <td data-etiqueta="Descripción">{c.Descripcion ?? '—'}</td>
                  <td data-etiqueta="Estado">{c.Activo ? 'Activa' : 'Inactiva'}</td>
                  <td><button type="button" onClick={() => setEdicion(c)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EstadoConsulta>
    </section>
  );
}
