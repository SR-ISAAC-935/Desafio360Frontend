import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Campo } from '../../Components/Campo';
import { MensajeError } from '../../Components/MensajeError';
import { TablaPaginada, type Columna } from '../../Components/TablaPaginada';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { ajusteSchema, type AjusteForm } from '../../schemas/admin.schemas';
import { inventarioAdmin } from '../../services/admin.services';
import { catalogoService } from '../../services/catalogo.services';
import type { Existencia, MovimientoKardex } from '../../Tipos/admin';
import { fechaHora } from '../../utils/formato';

const nombreVariante = (e: Existencia) => [e.Talla, e.Color].filter(Boolean).join(' / ') || '—';

function KardexPanel({ variante }: { variante: Existencia }) {
  const [pagina, setPagina] = useState(1);
  const consulta = useQuery({
    queryKey: ['kardex', variante.IDVariante, pagina],
    queryFn: () => inventarioAdmin.kardex(variante.IDVariante, { pagina, tamanoPagina: 10 }),
    placeholderData: keepPreviousData,
  });

  const columnas: Columna<MovimientoKardex>[] = [
    { titulo: 'Fecha', celda: (m) => fechaHora(m.FechaMovimiento) },
    { titulo: 'Tipo', celda: (m) => m.TipoMovimiento },
    { titulo: 'Cantidad', celda: (m) => (m.Cantidad > 0 ? `+${m.Cantidad}` : String(m.Cantidad)) },
    { titulo: 'Existencia', celda: (m) => m.ExistenciaResultante },
    { titulo: 'Motivo', celda: (m) => m.Motivo ?? '—' },
    { titulo: 'Usuario', celda: (m) => m.Usuario },
    { titulo: 'Pedido', celda: (m) => (m.IDPedido ? <Link to={`/pedidos/${m.IDPedido}`}>#{m.IDPedido}</Link> : '—') },
  ];

  return (
    <div className="panel">
      <h2>Kardex de {variante.SKU}</h2>
      <TablaPaginada
        consulta={consulta}
        columnas={columnas}
        clave={(m) => m.IDMovimiento}
        pagina={pagina}
        onPagina={setPagina}
        mensajeVacio="Esta variante todavía no tiene movimientos."
      />
    </div>
  );
}

function AjusteFormulario({ variante, alTerminar }: { variante: Existencia; alTerminar: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<AjusteForm>({
    resolver: zodResolver(ajusteSchema),
    defaultValues: { tipo: 'ENTRADA' },
  });
  const ajustar = useMutation({
    mutationFn: (d: AjusteForm) => inventarioAdmin.ajustar({ idVariante: variante.IDVariante, ...d }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['existencias'] }),
        qc.invalidateQueries({ queryKey: ['kardex', variante.IDVariante] }),
      ]);
      alTerminar();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => ajustar.mutate(d))} noValidate className="panel formulario">
      <h2>Ajustar {variante.SKU}</h2>
      <p>Existencia física actual: <strong>{variante.ExistenciaFisica}</strong> · Reservado: {variante.Reservado}</p>

      <Campo etiqueta="Tipo de movimiento" error={errors.tipo?.message}>
        <select {...register('tipo')}>
          <option value="ENTRADA">Entrada (compra a proveedor, cantidad positiva)</option>
          <option value="AJUSTE">Ajuste (corrección, positiva o negativa)</option>
        </select>
      </Campo>

      <Campo etiqueta="Cantidad" error={errors.cantidad?.message}>
        <input type="number" step={1} {...register('cantidad', { valueAsNumber: true })} />
      </Campo>

      <Campo etiqueta="Motivo" error={errors.motivo?.message}>
        <input {...register('motivo')} maxLength={255} />
      </Campo>

      <MensajeError error={ajustar.error} />
      <div className="botones">
        <button type="submit" disabled={ajustar.isPending}>{ajustar.isPending ? 'Guardando…' : 'Guardar movimiento'}</button>
        <button type="button" onClick={alTerminar}>Cancelar</button>
      </div>
    </form>
  );
}

/** Controles solo para Administrador: comprobación de integridad y liberación de reservas vencidas. */
function HerramientasAdmin() {
  const qc = useQueryClient();
  const verificar = useMutation({ mutationFn: inventarioAdmin.verificar });
  const liberar = useMutation({
    mutationFn: inventarioAdmin.liberarReservas,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['existencias'] }),
  });

  return (
    <div className="panel">
      <h2>Herramientas del administrador</h2>
      <div className="botones">
        <button type="button" disabled={verificar.isPending} onClick={() => verificar.mutate()}>
          {verificar.isPending ? 'Verificando…' : 'Verificar integridad del kardex'}
        </button>
        <button type="button" disabled={liberar.isPending} onClick={() => liberar.mutate()}>
          {liberar.isPending ? 'Liberando…' : 'Liberar reservas vencidas'}
        </button>
      </div>

      <MensajeError error={verificar.error} />
      {verificar.data && (verificar.data.coincide
        ? <p>La existencia coincide con la suma del kardex en todas las variantes.</p>
        : (
          <div role="alert" className="error">
            <p>Se encontraron {verificar.data.diferencias.length} diferencias:</p>
            <ul>
              {verificar.data.diferencias.map((d) => (
                <li key={d.IDVariante}>{d.SKU}: existencia {d.ExistenciaFisica}, kardex {d.SumaKardex}</li>
              ))}
            </ul>
          </div>
        ))}

      <MensajeError error={liberar.error} />
      {liberar.data && <p>Reservas liberadas: {liberar.data.reservasLiberadas}.</p>}
    </div>
  );
}

export function Inventario() {
  const { usuario } = useAuth();
  const [pagina, setPagina] = useState(1);
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState<number | undefined>(undefined);
  const [seleccion, setSeleccion] = useState<{ variante: Existencia; modo: 'kardex' | 'ajuste' } | null>(null);
  const textoFinal = useDebounce(texto.trim());

  const categoriasQ = useQuery({ queryKey: ['categorias'], queryFn: catalogoService.categorias });
  const consulta = useQuery({
    queryKey: ['existencias', { pagina, textoFinal, categoria }],
    queryFn: () => inventarioAdmin.existencias({ pagina, tamanoPagina: 15, texto: textoFinal || undefined, categoria }),
    placeholderData: keepPreviousData,
  });

  const columnas: Columna<Existencia>[] = [
    { titulo: 'SKU', celda: (e) => e.SKU },
    { titulo: 'Producto', celda: (e) => <>{e.NombreProducto}<br /><small>{e.NombreCategoria}</small></> },
    { titulo: 'Variante', celda: nombreVariante },
    { titulo: 'Inventario', celda: (e) => e.ExistenciaFisica },
    { titulo: 'Reservado', celda: (e) => e.Reservado },
    { titulo: 'Disponible', celda: (e) => <strong>{e.Disponible}</strong> },
    { titulo: 'Estado', celda: (e) => (e.Activo ? 'Activa' : 'Inactiva') },
    {
      titulo: 'Acciones',
      celda: (e) => (
        <div className="botones">
          <button type="button" onClick={() => setSeleccion({ variante: e, modo: 'kardex' })}>Kardex</button>
          <button type="button" onClick={() => setSeleccion({ variante: e, modo: 'ajuste' })}>Ajustar</button>
        </div>
      ),
    },
  ];

  return (
    <section>
      <h1>Inventario</h1>

      <div className="filtros">
        <input type="search" placeholder="Buscar por producto o SKU" value={texto} onChange={(e) => { setTexto(e.target.value); setPagina(1); }} />
        <select value={categoria ?? ''} onChange={(e) => { setCategoria(e.target.value ? Number(e.target.value) : undefined); setPagina(1); }}>
          <option value="">Todas las categorías</option>
          {categoriasQ.data?.map((c) => <option key={c.IDCategoria} value={c.IDCategoria}>{c.NombreCategoria}</option>)}
        </select>
      </div>

      <TablaPaginada consulta={consulta} columnas={columnas} clave={(e) => e.IDVariante} pagina={pagina} onPagina={setPagina} mensajeVacio="No hay variantes que coincidan." />

      {seleccion?.modo === 'kardex' && <KardexPanel key={seleccion.variante.IDVariante} variante={seleccion.variante} />}
      {seleccion?.modo === 'ajuste' && (
        <AjusteFormulario key={seleccion.variante.IDVariante} variante={seleccion.variante} alTerminar={() => setSeleccion(null)} />
      )}

      {usuario?.NombreRol === 'Administrador' && <HerramientasAdmin />}
    </section>
  );
}
