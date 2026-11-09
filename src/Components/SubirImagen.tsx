import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { imagenesAdmin } from '../services/admin.services';
import { MensajeError } from './MensajeError';

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const MAXIMO_MB = 5;

interface Props {
  valor: string;
  onCambio: (url: string) => void;
}

/**
 * Sube la imagen DIRECTO a Cloudinary con una firma que entrega el backend; nuestra API nunca recibe el archivo.
 * El resultado es una URL https que se guarda como ImagenUrl de la variante.
 */
export function SubirImagen({ valor, onCambio }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const subir = useMutation({
    mutationFn: (archivo: File) => imagenesAdmin.subir(archivo),
    onSuccess: onCambio,
  });

  const alElegir = (archivo: File | undefined) => {
    if (!archivo) return;
    if (!TIPOS.includes(archivo.type)) {
      subir.reset();
      alert('Formato no permitido. Usa JPG, PNG o WEBP.');
      return;
    }
    if (archivo.size > MAXIMO_MB * 1024 * 1024) {
      subir.reset();
      alert(`La imagen supera ${MAXIMO_MB} MB.`);
      return;
    }
    subir.mutate(archivo);
  };

  return (
    <div className="subir-imagen">
      {valor && <img src={valor} alt="Vista previa" width={80} />}
      <input
        ref={entrada}
        type="file"
        accept={TIPOS.join(',')}
        disabled={subir.isPending}
        onChange={(e) => { alElegir(e.target.files?.[0]); e.target.value = ''; }}
      />
      {subir.isPending && <p aria-busy="true">Subiendo imagen…</p>}
      <MensajeError error={subir.error} porDefecto="No se pudo subir la imagen. Verifica que Cloudinary esté configurado." />
      {valor && <button type="button" onClick={() => onCambio('')}>Quitar imagen</button>}
    </div>
  );
}
