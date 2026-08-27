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

    // Estado para mostrar precio base al hacer clic
    const [precioVisible, setPrecioVisible] = useState({});

    // Inicializar con TODOS los productos disponibles
    useEffect(() => {
        if (productos.length > 0) {
            const initialFilas = productos.map((producto, index) => ({
                id: index + 1,
                productoId: producto.id
            }));
            setFilas(initialFilas);
            setNextId(productos.length + 1);

            // Inicializar los estados
            const initialCantidadesIniciales = {};
            const initialCantidadesDevueltas = {};
            const initialProductosSeleccionados = {};

            productos.forEach((producto, index) => {
                const id = index + 1;
                initialCantidadesIniciales[id] = 0;
                initialCantidadesDevueltas[id] = 0;
                initialProductosSeleccionados[id] = producto.id;
            });

            setCantidadesIniciales(initialCantidadesIniciales);
            setCantidadesDevueltas(initialCantidadesDevueltas);
            setProductosSeleccionados(initialProductosSeleccionados);
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
                                                {productoEncontrado && !mostrarPrecio && (
                                                    <span className="ml-2 text-[11px] text-gray-400">
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Cantidad Devuelta - Input */}
                                        <td className="px-1 py-1 text-center">
                                            <input
                                                type="number"
                                                value={cantidadDevuelta || ''}
                                                onChange={(e) => handleCantidadDevueltaChange(fila.id, e.target.value)}
                                                className={`w-16 px-2 py-1 text-center text-black text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${!productoEncontrado ? 'opacity-50 cursor-not-allowed' : 'border-gray-300'
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
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
}