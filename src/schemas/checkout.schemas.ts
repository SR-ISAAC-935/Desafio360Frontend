import { z } from 'zod';

/* Refleja crearDireccionSchema del backend. */
export const direccionSchema = z.object({
  direccion: z.string().trim().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  zona: z.string().trim().max(10, 'Máximo 10 caracteres'),
  municipio: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  departamento: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  referencia: z.string().trim().max(255, 'Máximo 255 caracteres'),
  codigoPostal: z.string().trim().max(10, 'Máximo 10 caracteres'),
});
export type DireccionForm = z.infer<typeof direccionSchema>;
