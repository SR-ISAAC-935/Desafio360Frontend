import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, type LoginFormData } from '../schemas/auth.schemas';
import { Campo } from '../Components/Campo';

export function Login() {
  const navigate = useNavigate();
  const ubicacion = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  // Si venía de una página protegida (por ejemplo el checkout), vuelve allí después de entrar.
  const destino = (ubicacion.state as { desde?: { pathname?: string } } | null)?.desde?.pathname ?? '/';

  const onSubmit = async (datos: LoginFormData) => {
    setError('');
    try {
      await login(datos.email, datos.password);
      navigate(destino, { replace: true });
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data?.error?.mensaje ?? 'No se pudo conectar con el servidor.')
          : 'Ocurrió un error inesperado.',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="formulario">
      <h1>Iniciar sesión</h1>

      <Campo etiqueta="Correo" error={errors.email?.message}>
        <input {...register('email')} type="email" autoComplete="username" />
      </Campo>

      <Campo etiqueta="Contraseña" error={errors.password?.message}>
        <input {...register('password')} type="password" autoComplete="current-password" />
      </Campo>

      {error && <p role="alert" className="error">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </button>

      <p>¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
    </form>
  );
}
