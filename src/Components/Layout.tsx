import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCarrito } from '../hooks/useCarrito';
import type { Rol } from '../Tipos/api';

// Menú por rol: solo se muestran las secciones a las que el rol tiene acceso (el backend lo vuelve a validar).
const ENLACES: Record<Rol, { to: string; texto: string }[]> = {
  Cliente: [{ to: '/mis-pedidos', texto: 'Mis pedidos' }],
  Operador: [
    { to: '/admin/pedidos', texto: 'Pedidos' },
    { to: '/admin/inventario', texto: 'Inventario' },
  ],
  Administrador: [
    { to: '/admin', texto: 'Panel' },
    { to: '/admin/pedidos', texto: 'Pedidos' },
    { to: '/admin/inventario', texto: 'Inventario' },
    { to: '/admin/productos', texto: 'Productos' },
    { to: '/admin/categorias', texto: 'Categorías' },
    { to: '/admin/cupones', texto: 'Cupones' },
    { to: '/admin/usuarios', texto: 'Usuarios' },
    { to: '/admin/bitacora', texto: 'Bitácora' },
  ],
};

export default function Layout() {
  const { usuario, logout } = useAuth();
  const { data: carrito } = useCarrito();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const salir = async () => {
    await logout();
    setAbierto(false);
    navigate('/login');
  };

  const puedeComprar = !usuario || usuario.NombreRol === 'Cliente';
  const unidades = carrito?.lineas.reduce((suma, l) => suma + l.Cantidad, 0) ?? 0;
  const enlaces = usuario ? ENLACES[usuario.NombreRol] : [];

  return (
    <div className="app">
      <header className="barra">
        <Link to="/" className="marca" onClick={() => setAbierto(false)}>ShopCart</Link>

        <button
          type="button"
          className="menu-boton"
          aria-expanded={abierto}
          aria-controls="menu-principal"
          onClick={() => setAbierto((a) => !a)}
        >
          Menú
        </button>

        <nav id="menu-principal" className={abierto ? 'menu abierto' : 'menu'} onClick={() => setAbierto(false)}>
          <NavLink to="/" end>Catálogo</NavLink>
          {puedeComprar && (
            <NavLink to="/carrito">Carrito{unidades > 0 && ` (${unidades})`}</NavLink>
          )}
          {enlaces.map((e) => (
            <NavLink key={e.to} to={e.to} end={e.to === '/admin'}>{e.texto}</NavLink>
          ))}
        </nav>

        <div className="sesion">
          {usuario ? (
            <>
              <span>{usuario.NombreCompleto} ({usuario.NombreRol})</span>
              <button type="button" onClick={salir}>Salir</button>
            </>
          ) : (
            <>
              <Link to="/login">Ingresar</Link>
              <Link to="/registro">Registrarse</Link>
            </>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>© 2026 ShopCart</footer>
    </div>
  );
}
