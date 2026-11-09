import { Link } from 'react-router-dom';

export function NoAutorizado() {
  return (
    <section>
      <h1>Sin permiso</h1>
      <p>Tu cuenta no tiene acceso a esta sección.</p>
      <Link to="/">Volver al inicio</Link>
    </section>
  );
}
