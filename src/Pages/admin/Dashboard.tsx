import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { EstadoConsulta } from '../../Components/EstadoConsulta';
import { TablaPaginada, type Columna } from '../../Components/TablaPaginada';
import { reportesAdmin } from '../../services/admin.services';
import type { CarritoAbandonado } from '../../Tipos/admin';
import { fechaHora, haceDiasISO, hoyISO, q } from '../../utils/formato';

/* Paleta de series validada con el validador de dataviz: azul principal; tinta y rejilla recesivas. */
const AZUL = '#2a78d6';
const TINTA = '#52514e';
const REJILLA = '#e1e0d9';

type Agrupacion = 'DIA' | 'SEMANA' | 'MES';

function Indicador({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="indicador">
      <small>{titulo}</small>
      <strong>{valor}</strong>
    </div>
  );
}

const formatoQ = (v: unknown) => q(Number(v));

function Abandonados() {
  const [pagina, setPagina] = useState(1);
  const consulta = useQuery({
    queryKey: ['carritos-abandonados', pagina],
    queryFn: () => reportesAdmin.carritosAbandonados({ pagina, tamanoPagina: 5 }),
  });
  const columnas: Columna<CarritoAbandonado>[] = [
    { titulo: 'Cliente', celda: (c) => c.Cliente ?? 'Invitado' },
    { titulo: 'Correo', celda: (c) => c.Email ?? '—' },
    { titulo: 'Última actividad', celda: (c) => fechaHora(c.FechaUltimaActividad) },
    { titulo: 'Productos', celda: (c) => c.Productos },
    { titulo: 'Valor', celda: (c) => q(c.ValorCarrito) },
  ];
  return <TablaPaginada consulta={consulta} columnas={columnas} clave={(c) => c.IDCarrito} pagina={pagina} onPagina={setPagina} mensajeVacio="No hay carritos abandonados." />;
}

export function Dashboard() {
  const [desde, setDesde] = useState(haceDiasISO(29));
  const [hasta, setHasta] = useState(hoyISO());
  const [agrupacion, setAgrupacion] = useState<Agrupacion>('DIA');
  const rangoInvalido = desde > hasta;
  const habilitado = !rangoInvalido && desde !== '' && hasta !== '';

  const resumen = useQuery({ queryKey: ['rep-resumen', desde, hasta], queryFn: () => reportesAdmin.resumen({ desde, hasta }), enabled: habilitado });
  const ventas = useQuery({ queryKey: ['rep-ventas', desde, hasta, agrupacion], queryFn: () => reportesAdmin.ventas({ desde, hasta, agrupacion }), enabled: habilitado });
  const categorias = useQuery({ queryKey: ['rep-categorias', desde, hasta], queryFn: () => reportesAdmin.categorias({ desde, hasta }), enabled: habilitado });
  const top = useQuery({ queryKey: ['rep-top', desde, hasta], queryFn: () => reportesAdmin.topProductos({ desde, hasta, top: 5 }), enabled: habilitado });

  const ind = resumen.data?.indicadores;

  return (
    <section>
      <h1>Panel de ventas</h1>

      <div className="filtros">
        <label>Desde <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} /></label>
        <label>Hasta <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} /></label>
        <select value={agrupacion} onChange={(e) => setAgrupacion(e.target.value as Agrupacion)} aria-label="Agrupar ventas por">
          <option value="DIA">Por día</option>
          <option value="SEMANA">Por semana</option>
          <option value="MES">Por mes</option>
        </select>
      </div>
      {rangoInvalido && <p role="alert" className="error">La fecha final no puede ser anterior a la inicial.</p>}

      <EstadoConsulta cargando={resumen.isLoading} hayError={resumen.isError} error={resumen.error} reintentar={() => void resumen.refetch()}>
        <div className="indicadores">
          <Indicador titulo="Pedidos" valor={String(ind?.NumeroPedidos ?? 0)} />
          <Indicador titulo="Total vendido" valor={q(ind?.TotalVendido ?? 0)} />
          <Indicador titulo="Ticket promedio" valor={q(ind?.TicketPromedio ?? 0)} />
          <Indicador titulo="Devuelto" valor={q(ind?.TotalDevuelto ?? 0)} />
          <Indicador titulo="Carritos abandonados" valor={String(resumen.data?.carritosAbandonados ?? 0)} />
        </div>
      </EstadoConsulta>

      <h2>Ventas por período</h2>
      <EstadoConsulta cargando={ventas.isLoading} hayError={ventas.isError} error={ventas.error} vacio={ventas.data?.length === 0} mensajeVacio="Sin ventas en el rango." reintentar={() => void ventas.refetch()}>
        <div className="grafica" role="img" aria-label="Gráfica de línea del total vendido por período">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={ventas.data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={REJILLA} vertical={false} />
              <XAxis dataKey="Periodo" tick={{ fill: TINTA, fontSize: 12 }} stroke={REJILLA} />
              <YAxis tick={{ fill: TINTA, fontSize: 12 }} stroke={REJILLA} tickFormatter={(v: number) => `Q${v}`} />
              <Tooltip formatter={formatoQ} labelFormatter={(l) => `Período ${String(l)}`} />
              <Line type="monotone" dataKey="TotalVendido" name="Total vendido" stroke={AZUL} strokeWidth={2} dot={{ r: 4, stroke: '#fcfcfb', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </EstadoConsulta>

      <h2>Ventas por categoría</h2>
      <EstadoConsulta cargando={categorias.isLoading} hayError={categorias.isError} error={categorias.error} vacio={categorias.data?.length === 0} mensajeVacio="Sin ventas en el rango." reintentar={() => void categorias.refetch()}>
        <div className="grafica" role="img" aria-label="Gráfica de barras del total vendido por categoría">
          <ResponsiveContainer width="100%" height={Math.max(160, (categorias.data?.length ?? 0) * 44)}>
            <BarChart data={categorias.data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={REJILLA} horizontal={false} />
              <XAxis type="number" tick={{ fill: TINTA, fontSize: 12 }} stroke={REJILLA} tickFormatter={(v: number) => `Q${v}`} />
              <YAxis type="category" dataKey="NombreCategoria" width={110} tick={{ fill: TINTA, fontSize: 12 }} stroke={REJILLA} />
              <Tooltip formatter={formatoQ} />
              <Bar dataKey="TotalVendido" name="Total vendido" fill={AZUL} radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </EstadoConsulta>

      <h2>Productos más vendidos</h2>
      <EstadoConsulta cargando={top.isLoading} hayError={top.isError} error={top.error} vacio={top.data?.length === 0} mensajeVacio="Sin ventas en el rango." reintentar={() => void top.refetch()}>
        <div className="tabla-scroll">
          <table>
            <thead><tr><th>Producto</th><th>Unidades</th><th>Total</th></tr></thead>
            <tbody>
              {top.data?.map((p) => (
                <tr key={p.IDProducto}>
                  <td data-etiqueta="Producto">{p.NombreProducto}</td>
                  <td data-etiqueta="Unidades">{p.UnidadesVendidas}</td>
                  <td data-etiqueta="Total">{q(p.TotalVendido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EstadoConsulta>

      <h2>Carritos abandonados</h2>
      <Abandonados />
    </section>
  );
}
