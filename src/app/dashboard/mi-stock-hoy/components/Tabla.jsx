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
}) {
    // ✅ Estado local - NUNCA se recarga desde el padre
    const [localProductos, setLocalProductos] = useState([]);
    const [inputValues, setInputValues] = useState({});
    const saveTimeoutRef = useRef({});
    const isSavingRef = useRef(false);
    const diaActualRef = useRef(diaSeleccionado);
    const initializadoRef = useRef(false);

    // ✅ SOLO se inicializa UNA VEZ al montar o cuando cambia el día
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

    // ✅ Guardar stock en segundo plano (SIN recargar)
    const guardarStock = useCallback(async (productoId, nuevoStock) => {
        if (esPasado) return;
        if (isSavingRef.current) return;
        if (!onUpdateStock) return;

        const stockParaBD = nuevoStock === null || nuevoStock === '' ? 0 : parseInt(nuevoStock) || 0;

        isSavingRef.current = true;
        try {
            await onUpdateStock(distribuidorId, productoId, stockParaBD);
        } catch (error) {
            console.error('❌ Error al guardar stock:', error);
        } finally {
            isSavingRef.current = false;
        }
    }, [esPasado, onUpdateStock, distribuidorId]);

    // Manejar cambio en input
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

        // ✅ Actualizar el producto localmente
        setLocalProductos(prev =>
            prev.map(p =>
                p.producto_id === key
                    ? { ...p, stock_inicial: finalValue, stock_actual: finalValue }
                    : p
            )
        );

        if (finalValue === null) {
            return;
        }

        if (saveTimeoutRef.current[key]) {
            clearTimeout(saveTimeoutRef.current[key]);
        }

        saveTimeoutRef.current[key] = setTimeout(async () => {
            await guardarStock(key, finalValue);
        }, 500);

    }, [esPasado, guardarStock]);

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

    // ✅ Combinar productos disponibles con el stock local (useMemo)
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
                    stock_inicial: null,
                    stock_actual: null,
                    stock_final: null,
                    precio_base: producto.precio_base || 0,
                    empresa: producto.empresa?.nombre || '',
                    empresa_color: producto.empresa?.color_primario || '#6366f1',
                    id: null,
                };
            }
        });
    }, [productosDisponibles, localProductos]);

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
            if (item.stock_inicial !== null && item.stock_inicial !== undefined && item.stock_inicial > 0) {
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

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-1 text-center text-xs font-medium text-gray-500 tracking-wider">
                                    Stock Inicial
                                </th>
                                <th className="px-4 py-1 text-left text-xs font-medium text-gray-500 tracking-wider">
                                    Cod
                                </th>
                                <th className="px-4 py-1 text-center text-xs font-medium text-gray-500 tracking-wider">
                                    Stock Final
                                </th>
                                <th className="px-4 py-1 text-center text-xs font-medium text-gray-500 tracking-wider">
                                    Ventas
                                </th>
                                <th className="px-4 py-1 text-right text-xs font-medium text-gray-500 tracking-wider">
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
                                    const tieneId = !!item.id;
                                    const key = item.producto_id || item.id;
                                    const displayValue = getDisplayValue(key);

                                    return (
                                        <motion.tr
                                            key={key}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={`hover:bg-gray-50 transition-colors ${!tieneId ? 'bg-yellow-50/30' : ''}`}
                                        >
                                            <td className="px-4 py-1 text-center text-black">
                                                <input
                                                    type="number"
                                                    value={displayValue}
                                                    onChange={(e) => handleInputChange(item, e.target.value)}
                                                    className={`w-24 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-medium ${esPasado
                                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
                                                        : !tieneId
                                                            ? 'border-yellow-400 bg-yellow-50'
                                                            : 'border-gray-300'
                                                        }`}
                                                    min="0"
                                                    disabled={esPasado}
                                                    placeholder="-"
                                                    readOnly={esPasado}
                                                />
                                                {esPasado && (
                                                    <span className="ml-1 text-xs text-gray-400">🔒</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-1 font-mono text-xs font-medium text-gray-700">
                                                {item.codigo || '-'}
                                            </td>
                                            <td className="px-4 py-1 text-center font-medium text-gray-700">
                                                {formatNumber(stockFinal)}
                                            </td>
                                            <td className="px-4 py-1 text-center">
                                                <span className={`font-medium ${vendidos > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {formatNumber(vendidos)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-1 text-right font-semibold text-blue-600">
                                                {formatPrice(totalBs)}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                            <tr className="font-bold">
                                <td className="px-4 py-3 text-right text-gray-600" colSpan="3">
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
                                <td className="px-4 py-2" colSpan="5">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <span>📊 Tarjetas: <strong className="text-gray-700">{formatPrice(totales.totalTarjetas)}</strong></span>
                                        <span>📱 Chips: <strong className="text-gray-700">{formatPrice(totales.totalChips)}</strong></span>
                                        <span>📦 Total productos: <strong className="text-gray-700">{filteredData.length}</strong></span>
                                        <span>📦 Total ventas: <strong className="text-gray-700">{formatNumber(totales.totalVentasUnidades)}</strong></span>
                                        {filteredData.some(item => !item.id) && (
                                            <span className="text-yellow-600">⚠️ Sin stock inicial</span>
                                        )}
                                        {esPasado && (
                                            <span className="text-gray-400">🔒 Día pasado - Solo lectura</span>
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
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                        <span className="text-gray-700">Total Efectivo:</span>
                        <span className="text-blue-600">{formatPrice(totales.totalEfectivo)}</span>
                    </div>
                    {esPasado && (
                        <div className="text-center text-xs text-gray-400 pt-1">🔒 Día pasado - Solo lectura</div>
                    )}
                </div>
            </div>

            {/* Mensaje si no hay stock inicial */}
            {filteredData.some(item => !item.id) && !esPasado && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
                    ⚠️ Los productos marcados como <strong>"Nuevo"</strong> no tienen stock registrado.
                    Ingresa un valor en <strong>"Stock Inicial"</strong> para guardarlos automáticamente.
                </div>
            )}
        </div>
    );
}