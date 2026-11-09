import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Campo } from '../Components/Campo';
import { MensajeError } from '../Components/MensajeError';
import { useAuth } from '../hooks/useAuth';
import { registroSchema, type RegistroFormData } from '../schemas/auth.schemas';
import { authService } from '../services/auth.services';

export function Registro() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<unknown>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<RegistroFormData>({ resolver: zodResolver(registroSchema) });

  const onSubmit = async (d: RegistroFormData) => {
    setError(null);
    try {
      await authService.registro(d.nombreCompleto, d.email, d.password);
      await login(d.email, d.password); // entra directamente con la cuenta recién creada
      navigate('/', { replace: true });
    } catch (e) {
      setError(e);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="formulario">
      <h1>Crear cuenta</h1>

      <Campo etiqueta="Nombre completo" error={errors.nombreCompleto?.message}>
        <input {...register('nombreCompleto')} autoComplete="name" />
      </Campo>

      <Campo etiqueta="Correo" error={errors.email?.message}>
        <input {...register('email')} type="email" autoComplete="email" />
      </Campo>

      <Campo etiqueta="Contraseña" error={errors.password?.message}>
        <input {...register('password')} type="password" autoComplete="new-password" />
      </Campo>

      <Campo etiqueta="Confirmar contraseña" error={errors.confirmar?.message}>
        <input {...register('confirmar')} type="password" autoComplete="new-password" />
      </Campo>

      <MensajeError error={error} porDefecto="No se pudo crear la cuenta." />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </form>
  );
}
