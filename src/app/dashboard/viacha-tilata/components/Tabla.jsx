'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tabla({
    productos = [],
    titulo = 'Productos',
}) {
    // Estado para filas dinámicas
    const [filas, setFilas] = useState([]);
    const [nextId, setNextId] = useState(1);

    // Estado para cantidades
    const [cantidadesIniciales, setCantidadesIniciales] = useState({});
    const [cantidadesDevueltas, setCantidadesDevueltas] = useState({});
    const [productosSeleccionados, setProductosSeleccionados] = useState({});
    const [codigosBusqueda, setCodigosBusqueda] = useState({});

    // Estado para mostrar precio base al hacer clic
    const [precioVisible, setPrecioVisible] = useState({});

    // Inicializar con los primeros 15 productos
    useEffect(() => {
        if (productos.length > 0) {
            // Mostrar solo los primeros 15 productos
            const productosMostrar = productos.slice(0, 15);

            const initialFilas = productosMostrar.map((producto, index) => ({
                id: index + 1,
                productoId: producto.id
            }));
            setFilas(initialFilas);
            setNextId(productos.length + 1);

            // Inicializar los estados
            const initialCantidadesIniciales = {};
            const initialCantidadesDevueltas = {};
            const initialProductosSeleccionados = {};
            const initialCodigosBusqueda = {};

            productosMostrar.forEach((producto, index) => {
                const id = index + 1;
                initialCantidadesIniciales[id] = 0;
                initialCantidadesDevueltas[id] = 0;
                initialProductosSeleccionados[id] = producto.id;
                initialCodigosBusqueda[id] = producto.codigo || '';
            });

            setCantidadesIniciales(initialCantidadesIniciales);
            setCantidadesDevueltas(initialCantidadesDevueltas);
            setProductosSeleccionados(initialProductosSeleccionados);
            setCodigosBusqueda(initialCodigosBusqueda);
        } else {
            // Si no hay productos, mostrar 2 filas vacías como fallback
            const initialFilas = [
                { id: 1, productoId: null },
                { id: 2, productoId: null }
            ];
            setFilas(initialFilas);
            setNextId(3);
            setCantidadesIniciales({});
            setCantidadesDevueltas({});
            setProductosSeleccionados({});
            setCodigosBusqueda({});
        }
    }, [productos]);

    // Formatear números
    const formatPrice = (value) => {
        return `${parseFloat(value || 0).toFixed(2)}`;
    };

    const formatNumber = (value) => {
        return parseInt(value || 0).toLocaleString('es-BO');
    };

    // Obtener producto por ID
    const getProductoFila = (filaId) => {
        const productoId = productosSeleccionados[filaId];
        return productos.find(p => p.id === productoId);
    };

    // Obtener producto por código
    const getProductoPorCodigo = (codigo) => {
        if (!codigo) return null;
        return productos.find(p =>
            p.codigo && p.codigo.toLowerCase() === codigo.toLowerCase()
        );
    };

    // Obtener precio base del producto (sin límites)
    const getPrecioBase = (producto) => {
        if (!producto) return 0;
        return producto.precio_base || 0;
    };

    // Calcular cantidad vendida (inicial - devuelta)
    const getCantidadVendida = (filaId) => {
        const inicial = cantidadesIniciales[filaId] || 0;
        const devuelta = cantidadesDevueltas[filaId] || 0;
        return Math.max(0, inicial - devuelta);
    };

    // Calcular total de una fila
    const calcularTotalFila = (filaId) => {
        const cantidadVendida = getCantidadVendida(filaId);
        const producto = getProductoFila(filaId);

        if (!producto || !cantidadVendida) return 0;
        const precioBase = getPrecioBase(producto);
        return cantidadVendida * precioBase;
    };

    // Manejar cambio de cantidad inicial
    const handleCantidadInicialChange = (filaId, value) => {
        const numValue = parseInt(value) || 0;
        setCantidadesIniciales(prev => ({
            ...prev,
            [filaId]: numValue
        }));
    };

    // Manejar cambio de cantidad devuelta
    const handleCantidadDevueltaChange = (filaId, value) => {
        const numValue = parseInt(value) || 0;
        setCantidadesDevueltas(prev => ({
            ...prev,
            [filaId]: numValue
        }));
    };

    // Manejar cambio de código de búsqueda
    const handleCodigoBusquedaChange = (filaId, value) => {
        setCodigosBusqueda(prev => ({
            ...prev,
            [filaId]: value
        }));

        // Buscar producto por código
        const producto = getProductoPorCodigo(value);
        if (producto) {
            setProductosSeleccionados(prev => ({
                ...prev,
                [filaId]: producto.id
            }));
            // Inicializar cantidades en 0
            setCantidadesIniciales(prev => ({
                ...prev,
                [filaId]: 0
            }));
            setCantidadesDevueltas(prev => ({
                ...prev,
                [filaId]: 0
            }));
        } else {
            setProductosSeleccionados(prev => ({
                ...prev,
                [filaId]: null
            }));
        }
    };

    // Manejar clic en el código para mostrar/ocultar precio
    const handleCodigoClick = (filaId) => {
        setPrecioVisible(prev => ({
            ...prev,
            [filaId]: !prev[filaId]
        }));
    };

    // Agregar nueva fila
    const agregarFila = () => {
        setFilas(prev => [...prev, { id: nextId, productoId: null }]);
        setNextId(prev => prev + 1);
        // Inicializar el código de búsqueda vacío
        setCodigosBusqueda(prev => ({
            ...prev,
            [nextId]: ''
        }));
    };

    // Eliminar fila
    const eliminarFila = (filaId) => {
        if (filas.length <= 1) {
            return;
        }
        setFilas(prev => prev.filter(f => f.id !== filaId));
        // Limpiar estados
        setCantidadesIniciales(prev => {
            const newState = { ...prev };
            delete newState[filaId];
            return newState;
        });
        setCantidadesDevueltas(prev => {
            const newState = { ...prev };
            delete newState[filaId];
            return newState;
        });
        setProductosSeleccionados(prev => {
            const newState = { ...prev };
            delete newState[filaId];
            return newState;
        });
        setPrecioVisible(prev => {
            const newState = { ...prev };
            delete newState[filaId];
            return newState;
        });
        setCodigosBusqueda(prev => {
            const newState = { ...prev };
            delete newState[filaId];
            return newState;
        });
    };

    // Calcular total general
    const totalGeneral = filas.reduce((sum, fila) => {
        return sum + calcularTotalFila(fila.id);
    }, 0);

    // Calcular cantidad total vendida
    const cantidadTotalVendida = filas.reduce((sum, fila) => {
        return sum + getCantidadVendida(fila.id);
    }, 0);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500  tracking-wider">
                                Sa. Inicial
                            </th>
                            <th className="px-1 py-2 text-left text-xs font-medium text-gray-500  tracking-wider">
                                Código
                            </th>
                            <th className="px-1 py-2 text-center text-xs font-medium text-gray-500  tracking-wider">
                                Sa. Final
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500  tracking-wider">
                                Ventas
                            </th>
                            <th className="px-2 py-2 text-right text-xs font-medium text-gray-500  tracking-wider">
                                Total
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500  tracking-wider">
                                Acción
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <AnimatePresence>
                            {filas.map((fila, index) => {
                                const cantidadInicial = cantidadesIniciales[fila.id] || 0;
                                const cantidadDevuelta = cantidadesDevueltas[fila.id] || 0;
                                const cantidadVendida = getCantidadVendida(fila.id);
                                const producto = getProductoFila(fila.id);
                                const precioBase = getPrecioBase(producto);
                                const total = calcularTotalFila(fila.id);
                                const tieneStock = cantidadVendida > 0;
                                const productoEncontrado = !!producto;
                                const esUnicaFila = filas.length === 1;
                                const mostrarPrecio = precioVisible[fila.id] || false;
                                const codigoBusqueda = codigosBusqueda[fila.id] || '';
                                // Verificar si es una fila de los primeros 15 (id <= 15)
                                const esFilaInicial = fila.id <= 15;

                                return (
                                    <motion.tr
                                        key={fila.id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className={`hover:bg-gray-50 transition-colors ${tieneStock ? 'bg-green-50/30' : ''}`}
                                    >
                                        {/* Cantidad Inicial - Input */}
                                        <td className="px-2 py-1 text-center text-black">
                                            <input
                                                type="number"
                                                value={cantidadInicial || ''}
                                                onChange={(e) => handleCantidadInicialChange(fila.id, e.target.value)}
                                                className={`w-16 px-2 py-1 text-center text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${!productoEncontrado ? 'opacity-50 cursor-not-allowed' : 'border-gray-300'
                                                    }`}
                                                min="0"
                                                placeholder="0"
                                                disabled={!productoEncontrado}
                                            />
                                        </td>

                                        {/* Código - Click para mostrar precio */}
                                        <td className="px-1 py-1">
                                            {esFilaInicial ? (
                                                <div
                                                    className="cursor-pointer hover:bg-gray-100 rounded leading-1.5 transition-colors inline-block"
                                                    onClick={() => handleCodigoClick(fila.id)}
                                                >
                                                    <span className={`font-mono text-sm font-medium ${productoEncontrado ? 'text-gray-800' : 'text-gray-400'}`}>
                                                        {productoEncontrado ? producto.codigo : '-'}
                                                    </span>
                                                    {productoEncontrado && mostrarPrecio && (
                                                        <span className="ml-2 text-[10px] text-blue-600 font-bold">
                                                            <br></br> {formatPrice(precioBase)}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={codigoBusqueda}
                                                        onChange={(e) => handleCodigoBusquedaChange(fila.id, e.target.value)}
                                                        className={`w-12 px-1 py-0.5 text-black text-sm font-mono border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${productoEncontrado ? 'border-green-400 bg-green-50' : 'border-gray-300'
                                                            }`}
                                                        placeholder="Código"
                                                    />
                                                    {!productoEncontrado && codigoBusqueda && (
                                                        <div className="text-[9px] text-red-500 mt-0.5">
                                                            No encontrado
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        {/* Cantidad Devuelta - Input */}
                                        <td className="px-1 py-1 text-center">
                                            <input
                                                type="number"
                                                value={cantidadDevuelta || ''}
                                                onChange={(e) => handleCantidadDevueltaChange(fila.id, e.target.value)}
                                                className={`w-10 px-2 py-1 text-center text-black text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${!productoEncontrado ? 'opacity-50 cursor-not-allowed' : 'border-gray-300'
                                                    }`}
                                                min="0"
                                                placeholder="0"
                                                disabled={!productoEncontrado}
                                            />
                                        </td>

                                        {/* Resta (Cantidad Vendida) - Solo lectura */}
                                        <td className="px-2 py-1 text-center">
                                            <span className={`text-sm font-bold ${tieneStock ? 'text-blue-600' : 'text-gray-400'}`}>
                                                {productoEncontrado ? formatNumber(cantidadVendida) : '-'}
                                            </span>
                                        </td>

                                        {/* Total - Solo lectura */}
                                        <td className="px-2 py-1 text-right">
                                            <span className={`font-bold ${tieneStock ? 'text-green-600' : 'text-gray-400'}`}>
                                                {productoEncontrado ? formatPrice(total) : '-'}
                                            </span>
                                        </td>

                                        {/* Acción - Eliminar */}
                                        <td className="px-2 py-1 text-center">
                                            <button
                                                onClick={() => eliminarFila(fila.id)}
                                                disabled={esUnicaFila}
                                                className={`p-1 rounded transition-colors ${esUnicaFila
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                                                    }`}
                                                title={esUnicaFila ? 'Debe haber al menos una fila' : 'Eliminar fila'}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                    {/* Footer con totales y botón agregar */}
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                        <tr>
                            <td colSpan="6" className="px-4 py-2">
                                <button
                                    onClick={agregarFila}
                                    className="w-full py-1.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <span className="text-lg">+</span>
                                    Agregar producto
                                </button>
                            </td>
                        </tr>
                        <tr className="font-bold">
                            <td className="px-2 py-3 text-gray-600 text-center" colSpan="3">
                                Total Ventas
                            </td>
                            <td className="px-2 py-3 text-center text-blue-600">
                                {formatNumber(cantidadTotalVendida)}
                            </td>
                            <td className="px-2 py-3 text-right text-green-600 text-base">
                                {formatPrice(totalGeneral)}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}