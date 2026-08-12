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

    // Estado para cantidades y códigos por fila
    const [cantidades, setCantidades] = useState({});
    const [codigos, setCodigos] = useState({});
    const [productosSeleccionados, setProductosSeleccionados] = useState({});

    // Inicializar con 2 filas vacías
    useEffect(() => {
        const initialFilas = [
            { id: 1, productoId: null },
            { id: 2, productoId: null }
        ];
        setFilas(initialFilas);
        setNextId(3);
    }, []);

    // Formatear números
    const formatPrice = (value) => {
        return `Bs. ${parseFloat(value || 0).toFixed(2)}`;
    };

    const formatNumber = (value) => {
        return parseInt(value || 0).toLocaleString('es-BO');
    };

    // Obtener producto por código
    const getProductoPorCodigo = (codigo) => {
        if (!codigo) return null;
        return productos.find(p =>
            p.codigo && p.codigo.toLowerCase() === codigo.toLowerCase()
        );
    };

    // Obtener precio según cantidad y límite
    const getPrecioActual = (producto, cantidad) => {
        if (!producto) return 0;
        const precioBase = producto.precio_base || 0;
        const limite = producto.limite || 0;
        const precioPostLimite = producto.precio_post_limite || precioBase;

        if (!limite || limite === 0 || cantidad < limite) {
            return precioBase;
        }
        return precioPostLimite;
    };

    // Calcular total de una fila
    const calcularTotalFila = (filaId) => {
        const cantidad = cantidades[filaId] || 0;
        const productoId = productosSeleccionados[filaId];
        const producto = productos.find(p => p.id === productoId);

        if (!producto || !cantidad) return 0;
        const precioActual = getPrecioActual(producto, cantidad);
        return cantidad * precioActual;
    };

    // Verificar si alcanzó el límite
    const alcanzoLimite = (filaId) => {
        const cantidad = cantidades[filaId] || 0;
        const productoId = productosSeleccionados[filaId];
        const producto = productos.find(p => p.id === productoId);

        if (!producto) return false;
        const limite = producto.limite || 0;
        return limite > 0 && cantidad >= limite;
    };

    // Obtener producto de una fila
    const getProductoFila = (filaId) => {
        const productoId = productosSeleccionados[filaId];
        return productos.find(p => p.id === productoId);
    };

    // Manejar cambio de código
    const handleCodigoChange = (filaId, value) => {
        setCodigos(prev => ({
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
            // Inicializar cantidad en 0
            setCantidades(prev => ({
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

    // Manejar cambio de cantidad
    const handleCantidadChange = (filaId, value) => {
        const numValue = parseInt(value) || 0;
        setCantidades(prev => ({
            ...prev,
            [filaId]: numValue
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
            // Esto no debería pasar porque el botón está deshabilitado, pero por seguridad
            return;
        }
        setFilas(prev => prev.filter(f => f.id !== filaId));
        // Limpiar estados
        setCodigos(prev => {
            const newState = { ...prev };
            delete newState[filaId];
            return newState;
        });
        setCantidades(prev => {
            const newState = { ...prev };
            delete newState[filaId];
            return newState;
        });
        setProductosSeleccionados(prev => {
            const newState = { ...prev };
            delete newState[filaId];
            return newState;
        });
    };

    // Calcular total general
    const totalGeneral = filas.reduce((sum, fila) => {
        return sum + calcularTotalFila(fila.id);
    }, 0);

    // Calcular cantidad total
    const cantidadTotal = filas.reduce((sum, fila) => {
        return sum + (cantidades[fila.id] || 0);
    }, 0);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Título */}
            <div className="px-1 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700">{titulo}</h3>
                <span className="text-xs text-gray-500">
                    {filas.length} productos
                </span>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cód
                            </th>
                            <th className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cant
                            </th>
                            <th className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Precio
                            </th>
                            <th className="px-1 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                            </th>
                            <th className="px-1 py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acción
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <AnimatePresence>
                            {filas.map((fila, index) => {
                                const cantidad = cantidades[fila.id] || 0;
                                const codigo = codigos[fila.id] || '';
                                const producto = getProductoFila(fila.id);
                                const precioActual = producto ? getPrecioActual(producto, cantidad) : 0;
                                const total = calcularTotalFila(fila.id);
                                const tieneStock = cantidad > 0;
                                const enLimite = alcanzoLimite(fila.id);
                                const tieneLimite = producto?.limite && producto?.limite > 0;
                                const productoEncontrado = !!producto;
                                const esUnicaFila = filas.length === 1;

                                return (
                                    <motion.tr
                                        key={fila.id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className={`hover:bg-gray-50 transition-colors text-black ${tieneStock ? 'bg-green-50/30' : ''}`}
                                    >
                                        {/* Código - Input editable */}
                                        <td className="px-1 py-1">
                                            <input
                                                type="text"
                                                value={codigo}
                                                onChange={(e) => handleCodigoChange(fila.id, e.target.value)}
                                                className={`w-15 px-2 py-1 border rounded text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${productoEncontrado ? 'border-green-400 bg-green-50' : 'border-gray-300'
                                                    }`}
                                                placeholder="Ej:V10"
                                                autoFocus={index === 0}
                                            />
                                            {!productoEncontrado && codigo && (
                                                <div className="text-[10px] text-red-500 mt-0.5">
                                                    Producto no encontrado
                                                </div>
                                            )}
                                        </td>
                                        {/* Cantidad - Input editable */}
                                        <td className="px-1 py-1 text-center text-black">
                                            <input
                                                type="number"
                                                value={cantidad || ''}
                                                onChange={(e) => handleCantidadChange(fila.id, e.target.value)}
                                                className={`w-15 px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${enLimite ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                                                    } ${!productoEncontrado ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                min="0"
                                                placeholder="0"
                                                disabled={!productoEncontrado}
                                            />
                                            {enLimite && productoEncontrado && (
                                                <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                                                    ✅ Límite alcanzado
                                                </div>
                                            )}
                                        </td>

                                        {/* Precio Unitario */}
                                        <td className="px-1 py-1 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-sm font-bold ${enLimite ? 'text-amber-600' : 'text-gray-700'
                                                    } ${!productoEncontrado ? 'text-gray-400' : ''}`}>
                                                    {productoEncontrado ? formatPrice(precioActual) : '-'}
                                                </span>
                                                {enLimite && tieneLimite && productoEncontrado && (
                                                    <span className="text-[10px] text-gray-400 line-through">
                                                        {formatPrice(producto.precio_base)}
                                                    </span>
                                                )}
                                                {tieneLimite && !enLimite && cantidad > 0 && productoEncontrado && (
                                                    <span className="text-[10px] text-gray-400">
                                                        Faltan {formatNumber(producto.limite - cantidad)} para límite
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {/* Total - Cálculo en tiempo real */}
                                        <td className="px-1 py-1 text-right">
                                            <span className={`font-bold ${tieneStock ? 'text-blue-600' : 'text-gray-400'}`}>
                                                {productoEncontrado ? formatPrice(total) : '-'}
                                            </span>
                                            {enLimite && tieneLimite && productoEncontrado && (
                                                <div className="text-[10px] text-green-600">
                                                    Ahorro: {formatPrice(cantidad * (producto.precio_base - producto.precio_post_limite))}
                                                </div>
                                            )}
                                        </td>

                                        {/* Acción - Eliminar (deshabilitado si es la única fila) */}
                                        <td className="px-1 py-2 text-center">
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
                                            {esUnicaFila && (
                                                <div className="text-[8px] text-gray-400 mt-0.5">
                                                    Mínimo 1
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </AnimatePresence>
                    </tbody>
                    {/* Footer con totales y botón agregar */}
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                        <tr>
                            <td colSpan="6" className="px-4 py-3">
                                <button
                                    onClick={agregarFila}
                                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="text-lg">+</span>
                                    Agregar producto
                                </button>
                            </td>
                        </tr>
                        <tr className="font-bold">
                            <td className="px-4 py-3 text-gray-600" colSpan="2">
                                Totales
                            </td>
                            <td className="px-4 py-3 text-center text-blue-600">
                                {formatNumber(cantidadTotal)}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-400 text-xs">
                                -
                            </td>
                            <td className="px-4 py-3 text-right text-blue-600 text-base">
                                {formatPrice(totalGeneral)}
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-gray-400">
                                {filas.length} filas
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

        </div>
    );
}