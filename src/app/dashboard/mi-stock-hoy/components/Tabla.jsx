'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tabla({
    initialStockData = null,
    loading = false,
    diaSeleccionado = null,
    productosDisponibles = [],
    esPasado = false,
    distribuidorId = null,
    onUpdateStock = null,
    diaActivo = false,
}) {
    // ✅ Estado local
    const [localProductos, setLocalProductos] = useState([]);
    const [inputValues, setInputValues] = useState({});
    const diaActualRef = useRef(diaSeleccionado);
    const initializadoRef = useRef(false);

    // ✅ Función para obtener los stocks actuales (para el modal)
    const getStocksActuales = useCallback(() => {
        return inputValues;
    }, [inputValues]);

    // ✅ Función para guardar todos los stocks en la BD
    const guardarTodosLosStocks = useCallback(async () => {
        if (!onUpdateStock || !distribuidorId) return false;

        const promises = [];
        const productosAGuardar = [];

        Object.keys(inputValues).forEach(key => {
            const valor = inputValues[key];
            if (valor !== null && valor !== undefined && valor > 0) {
                promises.push(onUpdateStock(distribuidorId, key, valor));
                productosAGuardar.push({ producto_id: key, stock: valor });
            }
        });

        if (promises.length === 0) {
            return true; // No hay nada que guardar
        }

        try {
            await Promise.all(promises);
            console.log('✅ Stocks guardados:', productosAGuardar);
            return true;
        } catch (error) {
            console.error('Error al guardar stocks:', error);
            return false;
        }
    }, [inputValues, onUpdateStock, distribuidorId]);

    // ✅ Exponer funciones al padre
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__getStocksActuales = getStocksActuales;
            window.__guardarTodosLosStocks = guardarTodosLosStocks;
        }
    }, [getStocksActuales, guardarTodosLosStocks]);

    // ✅ SOLO se inicializa al montar o cuando cambia el día
    useEffect(() => {
        if (diaSeleccionado !== diaActualRef.current || !initializadoRef.current) {
            diaActualRef.current = diaSeleccionado;
            initializadoRef.current = true;

            if (initialStockData) {
                const productosData = initialStockData.productos || [];
                setLocalProductos(productosData);

                const newValues = {};
                productosData.forEach(item => {
                    const hasValidStock = item.stock_inicial !== null &&
                        item.stock_inicial !== undefined &&
                        item.stock_inicial > 0;
                    newValues[item.producto_id] = hasValidStock ? item.stock_inicial : null;
                });
                setInputValues(newValues);
            } else {
                setLocalProductos([]);
                setInputValues({});
            }
        }
    }, [diaSeleccionado, initialStockData]);

    // ✅ Actualizar localProductos cuando cambian los inputs
    useEffect(() => {
        setLocalProductos(prev =>
            prev.map(item => {
                const key = item.producto_id;
                if (inputValues[key] !== undefined) {
                    return {
                        ...item,
                        stock_inicial: inputValues[key],
                        stock_actual: inputValues[key],
                    };
                }
                return item;
            })
        );
    }, [inputValues]);

    // Manejar cambio en input (SOLO actualiza localmente)
    const handleInputChange = useCallback((item, value) => {
        if (esPasado) return;

        const rawValue = value === '' ? null : parseInt(value) || 0;
        const key = item.producto_id || item.id;
        const finalValue = rawValue === 0 ? null : rawValue;

        // ✅ Actualizar input localmente
        setInputValues(prev => ({
            ...prev,
            [key]: finalValue
        }));
    }, [esPasado]);

    // Ordenar productos
    const ordenarProductos = useCallback((data) => {
        const ordenTarjetas = ['Viva', 'Entel', 'Tigo'];
        const ordenChips = ['Entel', 'Viva', 'Tigo'];

        return [...data].sort((a, b) => {
            const empresaA = a.empresa || '';
            const empresaB = b.empresa || '';

            const esChipA = a.nombre?.toLowerCase().includes('chip') || false;
            const esChipB = b.nombre?.toLowerCase().includes('chip') || false;

            if (esChipA && !esChipB) return 1;
            if (!esChipA && esChipB) return -1;

            if (esChipA && esChipB) {
                const indexA = ordenChips.indexOf(empresaA);
                const indexB = ordenChips.indexOf(empresaB);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                return (a.nombre || '').localeCompare(b.nombre || '');
            }

            const indexA = ordenTarjetas.indexOf(empresaA);
            const indexB = ordenTarjetas.indexOf(empresaB);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            return (a.nombre || '').localeCompare(b.nombre || '');
        });
    }, []);

    // ✅ Combinar productos disponibles con el stock local
    const combinedData = useMemo(() => {
        if (!productosDisponibles || productosDisponibles.length === 0) {
            return [];
        }

        const stockMap = {};
        localProductos.forEach(item => {
            stockMap[item.producto_id] = item;
        });

        return productosDisponibles.map(producto => {
            const stock = stockMap[producto.id];
            if (stock) {
                return {
                    ...stock,
                    producto_id: producto.id,
                    producto: producto,
                };
            } else {
                return {
                    producto_id: producto.id,
                    producto: producto,
                    codigo: producto.codigo || '',
                    nombre: producto.nombre || '',
                    stock_inicial: inputValues[producto.id] || null,
                    stock_actual: inputValues[producto.id] || null,
                    stock_final: 0,
                    precio_base: producto.precio_base || 0,
                    empresa: producto.empresa?.nombre || '',
                    empresa_color: producto.empresa?.color_primario || '#6366f1',
                    id: null,
                };
            }
        });
    }, [productosDisponibles, localProductos, inputValues]);

    // ✅ Ordenar datos
    const filteredData = useMemo(() => {
        if (combinedData.length === 0) return [];
        return ordenarProductos(combinedData);
    }, [combinedData, ordenarProductos]);

    // ✅ Calcular totales
    const totales = useMemo(() => {
        let totalTarjetas = 0;
        let totalChips = 0;
        let totalVentasUnidades = 0;
        let totalEfectivo = 0;

        filteredData.forEach(item => {
            const stockInicial = item.stock_inicial || 0;
            const stockActual = item.stock_actual || 0;
            const vendidos = stockInicial - stockActual;
            const precio = item.precio_base || 0;
            const totalBs = vendidos * precio;
            const esChip = item.nombre?.toLowerCase().includes('chip') || false;

            totalVentasUnidades += vendidos;
            totalEfectivo += totalBs;
            if (esChip) {
                totalChips += totalBs;
            } else {
                totalTarjetas += totalBs;
            }
        });

        return {
            totalTarjetas,
            totalChips,
            totalGeneral: totalTarjetas + totalChips,
            totalVentasUnidades,
            totalEfectivo,
        };
    }, [filteredData]);

    const formatPrice = (value) => {
        return `Bs. ${parseFloat(value || 0).toFixed(2)}`;
    };

    const formatNumber = (value) => {
        return parseInt(value || 0).toLocaleString('es-BO');
    };

    const getDisplayValue = (key) => {
        const val = inputValues[key];
        if (val === null || val === undefined || val === 0) return '';
        return val;
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!productosDisponibles || productosDisponibles.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-800">No hay productos disponibles</h3>
                <p className="text-gray-500 text-sm mt-1">
                    Configura productos en el módulo de productos
                </p>
            </div>
        );
    }

    // Contar cuántos productos tienen stock > 0
    const productosConStock = Object.values(inputValues).filter(v => v !== null && v > 0).length;

    return (
        <div className="space-y-4">
            {/* ✅ Mensaje de estado del día */}
            {!diaActivo && !esPasado && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 flex items-center gap-2">
                    <span>📝</span>
                    <span>
                        Ingresa los stocks iniciales y presiona <strong>"Abrir Día"</strong> para guardarlos.
                        {productosConStock > 0 && (
                            <span className="ml-2 font-semibold">
                                ({productosConStock} productos con stock)
                            </span>
                        )}
                    </span>
                </div>
            )}

            {diaActivo && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
                    <span>✅</span>
                    <span>Día <strong>activo</strong>. Los stocks están guardados en la base de datos.</span>
                </div>
            )}

            {esPasado && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-500 flex items-center gap-2">
                    <span>🔒</span>
                    <span>Día pasado - Solo lectura</span>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-black">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">
                                    Stock Inicial
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                                    Código
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                                    Producto
                                </th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">
                                    Stock Final
                                </th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">
                                    Ventas
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 tracking-wider">
                                    Total Bs.
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <AnimatePresence>
                                {filteredData.map((item, index) => {
                                    const stockInicial = item.stock_inicial || 0;
                                    const stockFinal = item.stock_actual || 0;
                                    const vendidos = stockInicial - stockFinal;
                                    const totalBs = vendidos * (item.precio_base || 0);
                                    const key = item.producto_id || item.id;
                                    const displayValue = getDisplayValue(key);
                                    const tieneStock = displayValue !== '' && displayValue > 0;

                                    return (
                                        <motion.tr
                                            key={key}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={`hover:bg-gray-50 transition-colors ${tieneStock ? 'bg-green-50/20' : ''}`}
                                        >
                                            <td className="px-4 py-2 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={displayValue}
                                                        onChange={(e) => handleInputChange(item, e.target.value)}
                                                        className={`w-24 px-2 py-1.5 text-center border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-medium ${esPasado
                                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
                                                            : tieneStock
                                                                ? 'border-green-400 bg-green-50'
                                                                : 'border-gray-300'
                                                            }`}
                                                        min="0"
                                                        disabled={esPasado}
                                                        placeholder="0"
                                                    />
                                                    {tieneStock && !esPasado && (
                                                        <span className="text-green-500 text-xs">✓</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 font-mono text-xs font-medium text-gray-700">
                                                {item.codigo || '-'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-800">
                                                {item.nombre || '-'}
                                            </td>
                                            <td className="px-4 py-2 text-center font-medium text-gray-700">
                                                {formatNumber(stockFinal)}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <span className={`font-medium ${vendidos > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {formatNumber(vendidos)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right font-semibold text-blue-600">
                                                {formatPrice(totalBs)}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                            <tr className="font-bold">
                                <td className="px-4 py-3 text-right text-gray-600" colSpan="4">
                                    Totales del Día
                                </td>
                                <td className="px-4 py-3 text-center text-blue-600">
                                    {formatNumber(totales.totalVentasUnidades)}
                                </td>
                                <td className="px-4 py-3 text-right text-blue-600 text-base">
                                    {formatPrice(totales.totalEfectivo)}
                                </td>
                            </tr>
                            <tr className="text-xs text-gray-500">
                                <td className="px-4 py-2" colSpan="6">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <span>📊 Tarjetas: <strong className="text-gray-700">{formatPrice(totales.totalTarjetas)}</strong></span>
                                        <span>📱 Chips: <strong className="text-gray-700">{formatPrice(totales.totalChips)}</strong></span>
                                        <span>📦 Total productos: <strong className="text-gray-700">{filteredData.length}</strong></span>
                                        <span>📦 Con stock: <strong className="text-green-600">{productosConStock}</strong></span>
                                        {esPasado && (
                                            <span className="text-gray-400">🔒 Día pasado - Solo lectura</span>
                                        )}
                                        {!diaActivo && !esPasado && (
                                            <span className="text-blue-600">📝 Pendiente de guardar</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Resumen mobile */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:hidden">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Tarjetas:</span>
                        <span className="font-semibold text-blue-600">{formatPrice(totales.totalTarjetas)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Chips:</span>
                        <span className="font-semibold text-blue-600">{formatPrice(totales.totalChips)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Ventas (Und):</span>
                        <span className="font-semibold text-gray-700">{formatNumber(totales.totalVentasUnidades)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Productos con stock:</span>
                        <span className="font-semibold text-green-600">{productosConStock}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                        <span className="text-gray-700">Total Efectivo:</span>
                        <span className="text-blue-600">{formatPrice(totales.totalEfectivo)}</span>
                    </div>
                    {esPasado && (
                        <div className="text-center text-xs text-gray-400 pt-1">🔒 Día pasado - Solo lectura</div>
                    )}
                    {!diaActivo && !esPasado && (
                        <div className="text-center text-xs text-blue-600 pt-1">📝 Pendiente de guardar</div>
                    )}
                </div>
            </div>

            {/* Mensaje de productos sin stock */}
            {productosConStock === 0 && !esPasado && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
                    ⚠️ No has ingresado ningún stock. Ingresa los valores en <strong>"Stock Inicial"</strong> antes de abrir el día.
                </div>
            )}
        </div>
    );
}