import { Route, Routes } from 'react-router-dom';
import Layout from './Components/Layout';
import { RutaProtegida } from './Components/RutaProtegida';
import { Checkout } from './Pages/Checkout';
import { ConfirmacionPedido } from './Pages/ConfirmacionPedido';
import { Carrito } from './Pages/carrito';
import { Catalogo } from './Pages/catalogo';
import { DetallePedido } from './Pages/DetallePedido';
import { DetallePublico } from './Pages/DetallePublico';
import { Login } from './Pages/Login';
import { MisPedidos } from './Pages/MisPedidos';
import { NoAutorizado } from './Pages/NoAutorizado';
import { NoEncontrada } from './Pages/NoEncontrada';
import { Registro } from './Pages/Registro';
import { Bitacora } from './Pages/admin/Bitacora';
import { Categorias } from './Pages/admin/Categorias';
import { Cupones } from './Pages/admin/Cupones';
import { Dashboard } from './Pages/admin/Dashboard';
import { Inventario } from './Pages/admin/Inventario';
import { PedidosAdmin } from './Pages/admin/PedidosAdmin';
import { ProductoEditar } from './Pages/admin/ProductoEditar';
import { ProductoNuevo } from './Pages/admin/ProductoNuevo';
import { Productos } from './Pages/admin/Productos';
import { Usuarios } from './Pages/admin/Usuarios';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Público */}
        <Route path="/" element={<Catalogo />} />
        <Route path="/catalogo/producto/:id" element={<DetallePublico />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/no-autorizado" element={<NoAutorizado />} />

        {/* Cualquier usuario con sesión (el servidor decide si el pedido es suyo) */}
        <Route element={<RutaProtegida />}>
          <Route path="/pedidos/:id" element={<DetallePedido />} />
        </Route>

        {/* Solo Cliente */}
        <Route element={<RutaProtegida roles={['Cliente']} />}>
          <Route path="/mis-pedidos" element={<MisPedidos />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedido/:id/confirmacion" element={<ConfirmacionPedido />} />
        </Route>

        {/* Personal de la tienda */}
        <Route element={<RutaProtegida roles={['Operador', 'Administrador']} />}>
          <Route path="/admin/pedidos" element={<PedidosAdmin />} />
          <Route path="/admin/inventario" element={<Inventario />} />
        </Route>

        {/* Solo Administrador */}
        <Route element={<RutaProtegida roles={['Administrador']} />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/productos" element={<Productos />} />
          <Route path="/admin/productos/nuevo" element={<ProductoNuevo />} />
          <Route path="/admin/productos/:id" element={<ProductoEditar />} />
          <Route path="/admin/categorias" element={<Categorias />} />
          <Route path="/admin/cupones" element={<Cupones />} />
          <Route path="/admin/usuarios" element={<Usuarios />} />
          <Route path="/admin/bitacora" element={<Bitacora />} />
        </Route>

        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
