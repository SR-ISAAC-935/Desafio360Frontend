import { Route, Routes } from 'react-router-dom';
import { Login } from './Pages/Login';
import Layout from './Components/Layout';
import { RutaProtegida } from './Components/RutaProtegida';
import { Catalogo } from './Pages/catalogo';
import { Detalle } from './Pages/detalleAdmin';
import { DetallePublico } from '../src/Pages/detallesPublico';
import { Carrito } from './Pages/carrito';
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/no-autorizado" element={<h1>No tienes permiso</h1>} />

      <Route element={<Layout />}>
        {/* Público: el catálogo lo puede ver cualquiera */}
        <Route path="/" element={<Catalogo />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/catalogo/producto/:id" element={<DetallePublico/>} />
        <Route path="/carrito" element={<Carrito />} />
        {/* Requiere sesión */}
        <Route element={<RutaProtegida />}>
          <Route path="/pedidos" element={<h1>Mis pedidos</h1>} />
          <Route path="/carrito" element={<Carrito />} />
          {/* Solo administrador */}
          <Route element={<RutaProtegida roles={['Administrador']} />}>
            <Route path="/admin" element={<h1>Admin</h1>} />
            <Route path="/producto/:id" element={<Detalle />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}