import {useParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {TarjetaProducto} from '../Components/TarjetaProducto';
import {catalogoService} from '../services/catalogo.services';

export function Detalle(){

    const {id} = useParams();
const detalleProducto=useQuery({
    queryKey: ['detalle', id],
    queryFn: () => catalogoService.detalles(Number(id)),
    enabled: Number.isInteger(Number(id)) && Number(id) > 0,
});

if (detalleProducto.isPending) {
    return <p>Cargando producto...</p>;
}

if (detalleProducto.isError) {
    return <p>No se pudo obtener el producto.</p>;
}

return(
    <TarjetaProducto producto={detalleProducto.data!} />
)

}