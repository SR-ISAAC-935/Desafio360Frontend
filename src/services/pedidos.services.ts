import { api } from '../Tipos/api/cliente';
import type { Pagina } from '../Tipos/catalogo';
import type {
  DetallePedido,
  EstadoAvanzable,
  EstadoPedido,
  OrdenPedidos,
  PedidoPersonal,
  PedidoResumen,
} from '../Tipos/pedidos';
import { sinVacios } from '../utils/params';

export interface FiltrosPedidosPersonal {
  pagina: number;
  tamanoPagina: number;
  estado?: number;
  buscarCliente?: string;
  desde?: string;
  hasta?: string;
  ordenar: OrdenPedidos;
}

export const pedidosService = {
  async estados() {
    return (await api.get<EstadoPedido[]>('/pedidos/estados')).data;
  },
  async misPedidos(f: { pagina: number; tamanoPagina: number; estado?: number }) {
    return (await api.get<Pagina<PedidoResumen>>('/pedidos/mios', { params: sinVacios(f) })).data;
  },
  async listar(f: FiltrosPedidosPersonal) {
    return (await api.get<Pagina<PedidoPersonal>>('/pedidos', { params: sinVacios(f) })).data;
  },
  async detalle(id: number) {
    return (await api.get<DetallePedido>(`/pedidos/${id}`)).data;
  },
  async cancelar(id: number, motivo: string) {
    return (await api.post(`/pedidos/${id}/cancelar`, { motivo })).data;
  },
  async avanzar(id: number, estado: EstadoAvanzable, comentario?: string) {
    return (await api.patch(`/pedidos/${id}/estado`, { estado, comentario: comentario || undefined })).data;
  },
  async devolver(id: number, motivo: string, lineas: { idPedidoDetalle: number; cantidad: number }[]) {
    return (await api.post(`/pedidos/${id}/devoluciones`, { motivo, lineas })).data;
  },
};
