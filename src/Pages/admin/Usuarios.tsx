import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Campo } from '../../Components/Campo';
import { MensajeError } from '../../Components/MensajeError';
import { TablaPaginada, type Columna } from '../../Components/TablaPaginada';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { usuarioSchema, type UsuarioForm } from '../../schemas/admin.schemas';
import { usuariosAdmin } from '../../services/admin.services';
import type { Rol } from '../../Tipos/api';
import type { UsuarioFila } from '../../Tipos/admin';
import { soloFecha } from '../../utils/formato';

const ROLES: Rol[] = ['Cliente', 'Operador', 'Administrador'];

function NuevoUsuario({ alTerminar }: { alTerminar: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<UsuarioForm>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { rol: 'Operador' },
  });
  const crear = useMutation({
    mutationFn: usuariosAdmin.crear,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['usuarios'] });
      alTerminar();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => crear.mutate(d))} noValidate className="panel formulario">
      <h2>Nuevo usuario</h2>
      <Campo etiqueta="Nombre completo" error={errors.nombreCompleto?.message}>
        <input {...register('nombreCompleto')} maxLength={150} />
      </Campo>
      <Campo etiqueta="Correo" error={errors.email?.message}>
        <input type="email" autoComplete="off" {...register('email')} maxLength={150} />
      </Campo>
      <Campo etiqueta="Contraseña inicial" error={errors.password?.message}>
        <input type="password" autoComplete="new-password" {...register('password')} />
      </Campo>
      <Campo etiqueta="Rol" error={errors.rol?.message}>
        <select {...register('rol')}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
      </Campo>
      <MensajeError error={crear.error} />
      <div className="botones">
        <button type="submit" disabled={crear.isPending}>{crear.isPending ? 'Creando…' : 'Crear usuario'}</button>
        <button type="button" onClick={alTerminar}>Cancelar</button>
      </div>
    </form>
  );
}

export function Usuarios() {
  const qc = useQueryClient();
  const { usuario: yo } = useAuth();
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState('');
  const [rol, setRol] = useState<Rol | ''>('');
  const [estado, setEstado] = useState<'' | 'true' | 'false'>('');
  const [creando, setCreando] = useState(false);
  const textoFinal = useDebounce(texto.trim());

  const consulta = useQuery({
    queryKey: ['usuarios', { pagina, textoFinal, rol, estado }],
    queryFn: () =>
      usuariosAdmin.listar({
        pagina,
        tamanoPagina: 15,
        texto: textoFinal || undefined,
        rol: rol || undefined,
        activo: estado === '' ? undefined : estado === 'true',
      }),
    placeholderData: keepPreviousData,
  });

  const cambiarEstado = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => usuariosAdmin.cambiarEstado(id, activo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const columnas: Columna<UsuarioFila>[] = [
    { titulo: 'Nombre', celda: (u) => u.NombreCompleto },
    { titulo: 'Correo', celda: (u) => u.Email },
    { titulo: 'Rol', celda: (u) => u.NombreRol },
    { titulo: 'Alta', celda: (u) => soloFecha(u.FechaCreacion) },
    { titulo: 'Estado', celda: (u) => (u.Activo ? 'Activo' : 'Inactivo') },
    {
      titulo: 'Acción',
      celda: (u) =>
        u.IDUsuario === yo?.IDUsuario ? (
          <small>(tu cuenta)</small>
        ) : (
          <button
            type="button"
            disabled={cambiarEstado.isPending}
            onClick={() => {
              if (u.Activo && !window.confirm(`¿Desactivar a ${u.NombreCompleto}? Perderá el acceso.`)) return;
              cambiarEstado.mutate({ id: u.IDUsuario, activo: !u.Activo });
            }}
          >
            {u.Activo ? 'Desactivar' : 'Activar'}
          </button>
        ),
    },
  ];

  return (
    <section>
      <h1>Usuarios</h1>
      <button type="button" onClick={() => setCreando(true)}>Nuevo usuario</button>
      {creando && <NuevoUsuario alTerminar={() => setCreando(false)} />}

      <div className="filtros">
        <input type="search" placeholder="Buscar nombre o correo" value={texto} onChange={(e) => { setTexto(e.target.value); setPagina(1); }} />
        <select value={rol} onChange={(e) => { setRol(e.target.value as Rol | ''); setPagina(1); }}>
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={estado} onChange={(e) => { setEstado(e.target.value as '' | 'true' | 'false'); setPagina(1); }}>
          <option value="">Activos e inactivos</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
      </div>

      <MensajeError error={cambiarEstado.error} />
      <TablaPaginada consulta={consulta} columnas={columnas} clave={(u) => u.IDUsuario} pagina={pagina} onPagina={setPagina} mensajeVacio="No hay usuarios con esos filtros." />
    </section>
  );
}
