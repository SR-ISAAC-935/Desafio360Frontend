import { z } from 'zod';

const motivo = z.string().trim().min(3, 'El motivo es obligatorio (mínimo 3 caracteres).').max(255, 'Máximo 255 caracteres.');

export const motivoSchema = z.object({ motivo });
export type MotivoForm = z.infer<typeof motivoSchema>;

export const comentarioSchema = z.object({
  comentario: z.string().trim().max(255, 'Máximo 255 caracteres.'),
});
export type ComentarioForm = z.infer<typeof comentarioSchema>;

/** Devolución total o parcial: igual que el backend, al menos una línea y sin repetidas. */
export const devolucionSchema = z.object({
  motivo,
  lineas: z
    .array(z.object({ idPedidoDetalle: z.number().int().positive(), cantidad: z.number().int().min(1).max(1000) }))
    .min(1, 'Indique al menos una línea a devolver.'),
});
