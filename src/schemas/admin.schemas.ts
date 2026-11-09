import { z } from 'zod';

/* Reglas compartidas: reflejan las del backend (comunes.schemas.ts) para avisar antes de enviar. */
const tieneDosDecimales = (v: number) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;

const monto = z
  .number({ error: 'Ingresa un monto válido' })
  .min(0, 'No puede ser negativo')
  .max(9_999_999.99, 'Máximo Q 9,999,999.99')
  .refine(tieneDosDecimales, 'Máximo 2 decimales');

const entero = (min: number, max: number, nombre: string) =>
  z.number({ error: `Ingresa ${nombre}` }).int('Debe ser un número entero').min(min, `Mínimo ${min}`).max(max, `Máximo ${max}`);

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona una fecha')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
  }, 'La fecha no existe');

const motivo = z.string().trim().min(3, 'El motivo es obligatorio (mínimo 3 caracteres)').max(255, 'Máximo 255 caracteres');

/* ---------- Categorías ---------- */
export const categoriaSchema = z.object({
  nombreCategoria: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().trim().max(500, 'Máximo 500 caracteres'),
});
export type CategoriaForm = z.infer<typeof categoriaSchema>;

/* ---------- Inventario ---------- */
export const ajusteSchema = z.object({
  tipo: z.enum(['ENTRADA', 'AJUSTE']),
  cantidad: z
    .number({ error: 'Ingresa una cantidad' })
    .int('Debe ser un número entero')
    .min(-1_000_000, 'Valor fuera de rango')
    .max(1_000_000, 'Valor fuera de rango')
    .refine((v) => v !== 0, 'La cantidad no puede ser cero'),
  motivo,
}).refine((d) => d.tipo !== 'ENTRADA' || d.cantidad > 0, { path: ['cantidad'], message: 'Una entrada debe ser positiva' });
export type AjusteForm = z.infer<typeof ajusteSchema>;

/* ---------- Cupones ---------- */
export const cuponAdminSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .min(3, 'Mínimo 3 caracteres')
      .max(50, 'Máximo 50 caracteres')
      .regex(/^[A-Za-z0-9_-]+$/, 'Solo letras, números, guion y guion bajo'),
    descripcion: z.string().trim().max(255, 'Máximo 255 caracteres'),
    tipo: z.enum(['PORCENTAJE', 'MONTO_FIJO']),
    valor: monto.refine((v) => v > 0, 'Debe ser mayor a cero'),
    fechaInicio: fecha,
    fechaFin: fecha,
    montoMinimo: monto,
    limiteUsosTotal: entero(1, 100_000_000, 'el límite total'),
    limiteUsosPorCliente: entero(1, 1000, 'el límite por cliente'),
    idCategoria: z.number().int().positive().optional(),
  })
  .superRefine((c, ctx) => {
    if (c.tipo === 'PORCENTAJE' && c.valor > 100) {
      ctx.addIssue({ code: 'custom', path: ['valor'], message: 'Un porcentaje no puede superar 100' });
    }
    if (c.fechaFin < c.fechaInicio) {
      ctx.addIssue({ code: 'custom', path: ['fechaFin'], message: 'La fecha final no puede ser anterior a la inicial' });
    }
  });
export type CuponAdminForm = z.infer<typeof cuponAdminSchema>;

/* ---------- Usuarios ---------- */
const dentroDelLimite = (v: string) => new TextEncoder().encode(v).length <= 72;
export const usuarioSchema = z.object({
  email: z.string().trim().min(1, 'El correo es obligatorio').email('Correo inválido').max(150, 'Máximo 150 caracteres'),
  nombreCompleto: z.string().trim().min(2, 'Mínimo 2 caracteres').max(150, 'Máximo 150 caracteres'),
  password: z.string().min(8, 'Mínimo 8 caracteres').refine(dentroDelLimite, 'No puede superar 72 bytes'),
  rol: z.enum(['Cliente', 'Operador', 'Administrador']),
});
export type UsuarioForm = z.infer<typeof usuarioSchema>;

/* ---------- Productos y variantes ---------- */
const imagenUrl = z
  .string()
  .trim()
  .max(255, 'Máximo 255 caracteres')
  .refine((v) => v === '' || (URL.canParse(v) && new URL(v).protocol === 'https:'), 'La imagen debe ser una URL https');

export const varianteSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, 'El SKU es obligatorio')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[A-Za-z0-9._-]+$/, 'Solo letras, números, punto, guion y guion bajo'),
  talla: z.string().trim().max(30, 'Máximo 30 caracteres'),
  color: z.string().trim().max(30, 'Máximo 30 caracteres'),
  precio: monto,
  existenciaInicial: entero(0, 1_000_000, 'la existencia inicial'),
  imagenUrl,
});
export type VarianteForm = z.infer<typeof varianteSchema>;

export const productoNuevoSchema = z.object({
  nombreProducto: z.string().trim().min(2, 'Mínimo 2 caracteres').max(150, 'Máximo 150 caracteres'),
  idCategoria: z.number({ error: 'Selecciona una categoría' }).int().positive('Selecciona una categoría'),
  descripcion: z.string().trim().max(1000, 'Máximo 1000 caracteres'),
  variantes: z
    .array(varianteSchema)
    .min(1, 'El producto debe tener al menos una variante')
    .max(50, 'Máximo 50 variantes')
    .refine((v) => new Set(v.map((x) => x.sku.toLowerCase())).size === v.length, 'Hay SKU repetidos en las variantes'),
});
export type ProductoNuevoForm = z.infer<typeof productoNuevoSchema>;

export const productoEdicionSchema = z.object({
  nombreProducto: z.string().trim().min(2, 'Mínimo 2 caracteres').max(150, 'Máximo 150 caracteres'),
  idCategoria: z.number({ error: 'Selecciona una categoría' }).int().positive('Selecciona una categoría'),
  descripcion: z.string().trim().max(1000, 'Máximo 1000 caracteres'),
  activo: z.boolean(),
});
export type ProductoEdicionForm = z.infer<typeof productoEdicionSchema>;

export const varianteEdicionSchema = z.object({
  talla: z.string().trim().max(30, 'Máximo 30 caracteres'),
  color: z.string().trim().max(30, 'Máximo 30 caracteres'),
  imagenUrl,
  activo: z.boolean(),
});
export type VarianteEdicionForm = z.infer<typeof varianteEdicionSchema>;

export const precioSchema = z.object({ precio: monto });
export type PrecioForm = z.infer<typeof precioSchema>;
