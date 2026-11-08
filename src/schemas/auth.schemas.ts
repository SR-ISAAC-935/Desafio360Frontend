import { z } from 'zod';

const email = z.string().trim().min(1, 'El correo es obligatorio').email('Introduce un correo válido');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const registroSchema = z.object({
  email,
  nombreCompleto: z.string().trim().min(2, 'Escribe tu nombre completo').max(150),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistroFormData = z.infer<typeof registroSchema>;