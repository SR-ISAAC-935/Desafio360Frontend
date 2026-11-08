import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { authService } from '../services/auth.services';
import { loginSchema, type LoginFormData } from '../schemas/auth.schemas';

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (datos: LoginFormData) => {
    setError('');
    try {
      await authService.login(datos.email, datos.password);
      navigate('/');
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data?.error?.mensaje ?? 'No se pudo conectar con el servidor.')
          : 'Ocurrió un error inesperado.',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h1>Iniciar sesión</h1>

      <input {...register('email')} type="email" placeholder="Correo" autoComplete="username" />
      <span>{errors.email?.message}</span>

      <input {...register('password')} type="password" placeholder="Contraseña" autoComplete="current-password" />
      <span>{errors.password?.message}</span>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}