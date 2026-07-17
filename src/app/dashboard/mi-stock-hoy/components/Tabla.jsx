'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function Tabla({
    stockData = [],
    loading = false,
    onUpdateStock,
    diaSeleccionado = null,
    productosDisponibles = [],
}) {
    const [updatingStock, setUpdatingStock] = useState(false);
    const [localStockData, setLocalStockData] = useState([]);

    // Sincronizar stockData con estado local cuando cambie
    useEffect(() => {
        setLocalStockData(stockData);
    }, [stockData]);

    // Ordenar: Viva → Entel → Tigo (tarjetas) y luego Entel → Viva → Tigo (chips)
    const ordenarProductos = useCallback((data) => {
        const ordenTarjetas = ['Viva', 'Entel', 'Tigo'];
        const ordenChips = ['Entel', 'Viva', 'Tigo'];

        return [...data].sort((a, b) => {
            const empresaA = a.producto?.empresa?.nombre || a.empresa?.nombre || '';
            const empresaB = b.producto?.empresa?.nombre || b.empresa?.nombre || '';

            const esChipA = a.producto?.categoria?.nombre?.toLowerCase() === 'chip' ||
                a.producto?.nombre?.toLowerCase().includes('chip') ||
                a.nombre?.toLowerCase().includes('chip');
            const esChipB = b.producto?.categoria?.nombre?.toLowerCase() === 'chip' ||
                b.producto?.nombre?.toLowerCase().includes('chip') ||
                b.nombre?.toLowerCase().includes('chip');

            if (esChipA && !esChipB) return 1;
            if (!esChipA && esChipB) return -1;

            if (esChipA && esChipB) {
                const indexA = ordenChips.indexOf(empresaA);
                const indexB = ordenChips.indexOf(empresaB);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                return (a.producto?.nombre || a.nombre || '').localeCompare(b.producto?.nombre || b.nombre || '');
            }

            const indexA = ordenTarjetas.indexOf(empresaA);
            const indexB = ordenTarjetas.indexOf(empresaB);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            return (a.producto?.nombre || a.nombre || '').localeCompare(b.producto?.nombre || b.nombre || '');
        });
    }, []);

    // Calcular total en Bs de ventas
    const calcularTotalBs = useCallback((item) => {
        const stockInicial = item.stock_inicial || 0;
        const stockActual = item.stock_actual || 0;
        const vendidos = stockInicial - stockActual;
        const precio = item.producto?.precio_base || item.precio_base || 0;
        return vendidos * precio;
    }, []);

    // Calcular ventas en unidades
    const calcularVentas = useCallback((item) => {
        const stockInicial = item.stock_inicial || 0;
        const stockActual = item.stock_actual || 0;
        return stockInicial - stockActual;
    }, []);

    // ✅ Combinar productos con stock usando useMemo
    const combinedData = useMemo(() => {
        if (!productosDisponibles || productosDisponibles.length === 0) {
            return [];
        }

        const stockMap = {};
        localStockData.forEach(item => {
            stockMap[item.producto_id] = {
                ...item,
                producto: item.producto || productosDisponibles.find(p => p.id === item.producto_id)
            };
        });

        const combined = productosDisponibles.map(producto => {
            const stock = stockMap[producto.id];
            if (stock) {
                return stock;
            } else {
                return {
                    id: null,
                    producto_id: producto.id,
                    producto: producto,
                    stock_inicial: 0,
                    stock_actual: 0,
                    stock_final: 0,
                    distribuidor_id: null,
                    fecha: diaSeleccionado || new Date().toISOString().split('T')[0],
                };
            }
        });

        return combined;
    }, [productosDisponibles, localStockData, diaSeleccionado]);

    // ✅ Ordenar datos con useMemo (sin filtro)
    const filteredData = useMemo(() => {
        if (combinedData.length === 0) return [];
        return ordenarProductos(combinedData);
    }, [combinedData, ordenarProductos]);

    // ✅ Calcular totales con useMemo
    const totales = useMemo(() => {
        let totalTarjetas = 0;
        let totalChips = 0;
        let totalVentasUnidades = 0;
        let totalEfectivo = 0;

        filteredData.forEach(item => {
            const totalBs = calcularTotalBs(item);
            const ventas = calcularVentas(item);
            const esChip = item.producto?.categoria?.nombre?.toLowerCase() === 'chip' ||
                item.producto?.nombre?.toLowerCase().includes('chip');

            totalVentasUnidades += ventas;
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
    }, [filteredData, calcularTotalBs, calcularVentas]);

    // ✅ Actualizar stock inicial automáticamente
    const handleStockChange = useCallback(async (item, newValue) => {
        const newStock = parseInt(newValue) || 0;
        if (newStock < 0) return;

        setUpdatingStock(true);
        try {
            if (item.id) {
                const { error } = await supabase
                    .from('stock_diario')
                    .update({
                        stock_inicial: newStock,
                        stock_actual: newStock,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', item.id);

                if (error) throw error;

                setLocalStockData(prev =>
                    prev.map(d =>
                        d.id === item.id
                            ? { ...d, stock_inicial: newStock, stock_actual: newStock }
                            : d
                    )
                );

                if (onUpdateStock) {
                    onUpdateStock(item.id, newStock);
                }
            } else {
                const fecha = diaSeleccionado || new Date().toISOString().split('T')[0];
                const { data, error } = await supabase
                    .from('stock_diario')
                    .insert([{
                        distribuidor_id: item.distribuidor_id,
                        producto_id: item.producto_id,
                        fecha: fecha,
                        stock_inicial: newStock,
                        stock_actual: newStock,
                        stock_final: 0,
                    }])
                    .select()
                    .single();

                if (error) throw error;

                setLocalStockData(prev => [
                    ...prev,
                    {
                        ...data,
                        producto: item.producto,
                    }
                ]);

                if (onUpdateStock) {
                    onUpdateStock(data.id, newStock);
                }
            }
        } catch (error) {
            console.error('Error al actualizar stock:', error);
        } finally {
            setUpdatingStock(false);
        }
    }, [diaSeleccionado, onUpdateStock]);

    const formatPrice = (value) => {
        return `Bs. ${parseFloat(value || 0).toFixed(2)}`;
    };

    const formatNumber = (value) => {
        return parseInt(value || 0).toLocaleString('es-BO');
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
            {/* Tabla de stock - SOLO CÓDIGO */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Código
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock Inicial
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock Final
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ventas (Und)
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                    const totalBs = calcularTotalBs(item);
                                    const tieneId = !!item.id;

                                    return (
                                        <motion.tr
                                            key={item.id || `new-${item.producto_id}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={`hover:bg-gray-50 transition-colors ${!tieneId ? 'bg-yellow-50/30' : ''}`}
                                        >
                                            <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">
                                                {item.producto?.codigo || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="number"
                                                    value={stockInicial}
                                                    onChange={(e) => handleStockChange(item, e.target.value)}
                                                    className={`w-24 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-medium ${!tieneId ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}
                                                    min="0"
                                                    disabled={updatingStock}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-700">
                                                {formatNumber(stockFinal)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-medium ${vendidos > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {formatNumber(vendidos)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-blue-600">
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
                </div>
            </div>

            {/* Mensaje si no hay stock inicial */}
            {filteredData.some(item => !item.id) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
                    ⚠️ Los productos marcados como <strong>"Nuevo"</strong> no tienen stock registrado.
                    Ingresa un valor en <strong>"Stock Inicial"</strong> para guardarlos.
                </div>
            )}
        </div>
    );
}