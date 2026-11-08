import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Rol } from '../Tipos/api';
import { useCarrito } from '../hooks/useCarrito';

// Ajusta estas listas según lo que cada rol puede hacer en tu backend (src/routes).
const ENLACES: Record<Rol, { to: string; texto: string }[]> = {
  Cliente: [{ to: '/pedidos', texto: 'Mis pedidos' }],
  Operador: [{ to: '/pedidos', texto: 'Pedidos' }],
  Administrador: [{ to: '/pedidos', texto: 'Pedidos' }, { to: '/admin', texto: 'Admin' }],
};

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { data: carrito } = useCarrito();
  const puedeComprar = !usuario || usuario.NombreRol === 'Cliente';
  const unidades = carrito?.lineas.reduce((suma, l) => suma + l.Cantidad, 0) ?? 0;
  const salir = async () => {
    await logout();
    navigate('/login');
  };

  const enlaces = usuario ? ENLACES[usuario.NombreRol] : [];

  return (
    <div>
      <header>
        <Link to="/">ShopCart</Link>
        <nav>
          <NavLink to="/">Catálogo</NavLink>
          {enlaces.map((e) => (
            <NavLink key={e.to} to={e.to}>{e.texto}</NavLink>
          ))}
        </nav>
        {usuario ? (
          <div>
            <span>{usuario.NombreCompleto} ({usuario.NombreRol})</span>
            <button onClick={salir}>Salir</button>
          </div>
        ) : (
          <Link to="/login">Ingresar</Link>
        )}
        <div>
          <span>{puedeComprar ? `Carrito (${unidades})` : 'No puedes comprar'}</span>
          <Link to="/carrito">Ir al carrito</Link>
        </div>
        <div>
          <button onClick={salir}>Salir</button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>© 2026 ShopCart</footer>
    </div>
  );
}