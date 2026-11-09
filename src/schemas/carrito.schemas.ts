import { z } from 'zod';

/** Igual que el backend: 3 a 50 caracteres, solo letras, números, guion y guion bajo. */
export const cuponSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(3, 'El código del cupón es demasiado corto.')
    .max(50, 'El código del cupón es demasiado largo.')
    .regex(/^[A-Za-z0-9_-]+$/, 'El código solo admite letras, números, guion y guion bajo.'),
});

export type CuponForm = z.infer<typeof cuponSchema>;
