import { z } from 'zod';

const email = z.string().trim().min(1, 'El correo es obligatorio').email('Introduce un correo válido').max(150, 'Máximo 150 caracteres');

// bcrypt solo lee los primeros 72 BYTES: el backend lo rechaza, así que se avisa antes de enviar.
const dentroDelLimite = (valor: string) => new TextEncoder().encode(valor).length <= 72;
const MENSAJE_LIMITE = 'La contraseña no puede superar 72 bytes (menos caracteres si usa acentos o emojis).';

// En el login solo se exige que haya algo: la política de longitud aplica al registrarse.
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const registroSchema = z
  .object({
    nombreCompleto: z.string().trim().min(2, 'Escribe tu nombre completo (mínimo 2 caracteres)').max(150, 'Máximo 150 caracteres'),
    email,
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').refine(dentroDelLimite, MENSAJE_LIMITE),
    confirmar: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((d) => d.password === d.confirmar, { path: ['confirmar'], message: 'Las contraseñas no coinciden' });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistroFormData = z.infer<typeof registroSchema>;
