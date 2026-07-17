// app/dashboard/ventas/hooks/useAnularVenta.js
'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useAnularVenta() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // 🔄 Anular una venta y restaurar el stock
    const anularVenta = useCallback(async (ventaId, distribuidorId, motivo = null) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // 1. Obtener la venta con todos sus detalles
            const { data: venta, error: ventaError } = await supabase
                .from('ventas')
                .select(`
                    *,
                    cliente:cliente_id (id, nombre),
                    producto:producto_id (id, nombre, codigo)
                `)
                .eq('id', ventaId)
                .single();

            if (ventaError) throw ventaError;

            if (!venta) {
                throw new Error('Venta no encontrada');
            }

            console.log('📝 Venta a anular:', venta);

            // 2. Obtener el stock diario asociado a la venta
            const { data: stockDiario, error: stockError } = await supabase
                .from('stock_diario')
                .select('*')
                .eq('id', venta.stock_diario_id)
                .maybeSingle();

            if (stockError) throw stockError;

            if (!stockDiario) {
                throw new Error('No se encontró el stock diario asociado a esta venta');
            }

            console.log('📦 Stock diario encontrado:', stockDiario.id);

            // 3. Verificar que el día no esté cerrado
            if (stockDiario.estado === 'cerrado') {
                throw new Error('No se puede anular una venta de un día cerrado');
            }

            // 4. Restaurar stock del producto
            let productos = stockDiario.datos?.productos || [];
            const productoIndex = productos.findIndex(p => p.producto_id === venta.producto_id);

            if (productoIndex === -1) {
                throw new Error('Producto no encontrado en el stock del día');
            }

            const productoStock = productos[productoIndex];
            const stockAnterior = productoStock.stock_actual || 0;
            const nuevaCantidad = stockAnterior + venta.cantidad;

            // Actualizar stock del producto
            productos[productoIndex] = {
                ...productoStock,
                stock_actual: nuevaCantidad,
                stock_final: nuevaCantidad // Si está cerrado, se actualizará después
            };

            console.log(`📊 Stock restaurado: ${stockAnterior} → ${nuevaCantidad} (${venta.cantidad} unidades)`);

            // 5. Eliminar la venta del array de ventas del día
            let ventas = stockDiario.datos?.ventas || [];
            const ventaIndex = ventas.findIndex(v =>
                v.producto_id === venta.producto_id &&
                v.fecha === venta.fecha_venta &&
                v.cliente_id === venta.cliente_id
            );

            if (ventaIndex !== -1) {
                ventas.splice(ventaIndex, 1);
                console.log('🗑️ Venta eliminada del historial del día');
            }

            // 6. Recalcular resumen del día
            const totalProductos = productos.length;
            const stockInicialTotal = productos.reduce((sum, p) => sum + (p.stock_inicial || 0), 0);
            const stockActualTotal = productos.reduce((sum, p) => sum + (p.stock_actual || 0), 0);
            const stockFinalTotal = productos.reduce((sum, p) => sum + (p.stock_final || 0), 0);
            const totalVendido = productos.reduce((sum, p) => sum + ((p.stock_inicial || 0) - (p.stock_actual || 0)), 0);

            // Recalcular total efectivo de todas las ventas del día
            const totalEfectivo = ventas.reduce((sum, v) => sum + (v.total || 0), 0);

            const resumen = {
                total_productos: totalProductos,
                stock_inicial_total: stockInicialTotal,
                stock_actual_total: stockActualTotal,
                stock_final_total: stockFinalTotal,
                total_vendido: totalVendido,
                total_efectivo: totalEfectivo,
                total_ventas: ventas.length
            };

            console.log('📊 Resumen recalculado:', resumen);

            // 7. Actualizar stock_diario
            const { data: updatedStock, error: updateError } = await supabase
                .from('stock_diario')
                .update({
                    datos: {
                        productos: productos,
                        resumen: resumen,
                        ventas: ventas
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('id', stockDiario.id)
                .select()
                .single();

            if (updateError) {
                console.error('❌ Error al actualizar stock:', updateError);
                throw updateError;
            }

            console.log('✅ Stock diario actualizado');

            // 8. Registrar la anulación en la tabla de ventas (marcar como anulada)
            // En lugar de eliminar, marcamos como anulada para mantener historial
            const { error: updateVentaError } = await supabase
                .from('ventas')
                .update({
                    anulada: true,
                    motivo_anulacion: motivo || 'Anulación manual',
                    fecha_anulacion: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', ventaId);

            if (updateVentaError) {
                console.warn('⚠️ No se pudo marcar la venta como anulada:', updateVentaError);
                // No lanzamos error porque el stock ya fue restaurado
            }

            setSuccess(true);

            return {
                venta_anulada: {
                    ...venta,
                    anulada: true,
                    motivo_anulacion: motivo || 'Anulación manual'
                },
                stock_actualizado: updatedStock,
                producto_actualizado: productos[productoIndex],
                resumen: resumen,
                cantidad_restaurada: venta.cantidad
            };
        } catch (error) {
            console.error('❌ Error al anular venta:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 📊 Obtener historial de ventas anuladas
    const getVentasAnuladas = useCallback(async (distribuidorId, fechaInicio = null, fechaFin = null) => {
        try {
            let query = supabase
                .from('ventas')
                .select(`
                    *,
                    cliente:cliente_id (id, nombre),
                    producto:producto_id (id, nombre, codigo)
                `)
                .eq('anulada', true)
                .eq('distribuidor_id', distribuidorId)
                .order('fecha_anulacion', { ascending: false });

            if (fechaInicio) {
                query = query.gte('fecha_anulacion', fechaInicio);
            }

            if (fechaFin) {
                query = query.lte('fecha_anulacion', fechaFin);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener ventas anuladas:', error);
            return [];
        }
    }, []);

    // 🔄 Restaurar una venta anulada (deshacer anulación)
    const restaurarVentaAnulada = useCallback(async (ventaId, distribuidorId) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // 1. Obtener la venta anulada
            const { data: venta, error: ventaError } = await supabase
                .from('ventas')
                .select('*')
                .eq('id', ventaId)
                .eq('anulada', true)
                .single();

            if (ventaError) throw ventaError;

            if (!venta) {
                throw new Error('Venta anulada no encontrada');
            }

            // 2. Restaurar la venta (desmarcar anulación)
            const { error: updateError } = await supabase
                .from('ventas')
                .update({
                    anulada: false,
                    motivo_anulacion: null,
                    fecha_anulacion: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', ventaId);

            if (updateError) throw updateError;

            // 3. Restar del stock (como si se hubiera vendido nuevamente)
            // Obtener el stock diario
            const { data: stockDiario, error: stockError } = await supabase
                .from('stock_diario')
                .select('*')
                .eq('id', venta.stock_diario_id)
                .maybeSingle();

            if (stockError) throw stockError;

            if (!stockDiario) {
                throw new Error('No se encontró el stock diario');
            }

            // Actualizar stock restando la cantidad
            let productos = stockDiario.datos?.productos || [];
            const productoIndex = productos.findIndex(p => p.producto_id === venta.producto_id);

            if (productoIndex === -1) {
                throw new Error('Producto no encontrado en el stock del día');
            }

            productos[productoIndex].stock_actual = (productos[productoIndex].stock_actual || 0) - venta.cantidad;

            // Agregar la venta al array de ventas del día
            let ventas = stockDiario.datos?.ventas || [];
            ventas.push({
                producto_id: venta.producto_id,
                producto_nombre: productos[productoIndex].nombre || '',
                cantidad: venta.cantidad,
                precio_unitario: venta.subtotal / venta.cantidad,
                descuento: venta.descuento_total || 0,
                total: venta.total,
                cliente_id: venta.cliente_id,
                cliente_nombre: venta.cliente_nombre || '',
                fecha: venta.fecha_venta || new Date().toISOString()
            });

            // Recalcular resumen
            const totalProductos = productos.length;
            const stockInicialTotal = productos.reduce((sum, p) => sum + (p.stock_inicial || 0), 0);
            const stockActualTotal = productos.reduce((sum, p) => sum + (p.stock_actual || 0), 0);
            const stockFinalTotal = productos.reduce((sum, p) => sum + (p.stock_final || 0), 0);
            const totalVendido = productos.reduce((sum, p) => sum + ((p.stock_inicial || 0) - (p.stock_actual || 0)), 0);
            const totalEfectivo = ventas.reduce((sum, v) => sum + (v.total || 0), 0);

            const resumen = {
                total_productos: totalProductos,
                stock_inicial_total: stockInicialTotal,
                stock_actual_total: stockActualTotal,
                stock_final_total: stockFinalTotal,
                total_vendido: totalVendido,
                total_efectivo: totalEfectivo,
                total_ventas: ventas.length
            };

            // Actualizar stock_diario
            const { data: updatedStock, error: updateStockError } = await supabase
                .from('stock_diario')
                .update({
                    datos: {
                        productos: productos,
                        resumen: resumen,
                        ventas: ventas
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('id', stockDiario.id)
                .select()
                .single();

            if (updateStockError) throw updateStockError;

            setSuccess(true);
            return {
                venta_restaurada: venta,
                stock_actualizado: updatedStock
            };
        } catch (error) {
            console.error('Error al restaurar venta anulada:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        success,
        anularVenta,
        getVentasAnuladas,
        restaurarVentaAnulada,
        reset: () => {
            setError(null);
            setSuccess(false);
            setLoading(false);
        }
    };
}