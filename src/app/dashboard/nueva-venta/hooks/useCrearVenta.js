// app/dashboard/ventas/hooks/useCrearVenta.js
'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useCrearVenta() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // ✅ Validar datos de la venta (cliente y ruta son opcionales)
    const validarVenta = useCallback((data) => {
        const errores = [];

        if (!data.distribuidor_id) {
            errores.push('El distribuidor es requerido');
        }

        // ✅ Cliente es opcional - solo validamos si tiene cliente_nombre
        // if (!data.cliente_id) {
        //     errores.push('El cliente es requerido');
        // }

        // ✅ Ruta es opcional
        // if (!data.ruta_id) {
        //     errores.push('La ruta es requerida');
        // }

        if (!data.producto_id) {
            errores.push('El producto es requerido');
        }

        if (!data.cantidad || data.cantidad <= 0) {
            errores.push('La cantidad debe ser mayor a 0');
        }

        if (data.stock_disponible !== undefined && data.cantidad > data.stock_disponible) {
            errores.push(`Stock insuficiente. Disponible: ${data.stock_disponible}`);
        }

        if (!data.precio_unitario || data.precio_unitario <= 0) {
            errores.push('El precio unitario debe ser mayor a 0');
        }

        return errores;
    }, []);

    // 💰 Calcular totales de la venta
    const calcularTotales = useCallback((items) => {
        let subtotal = 0;
        let descuento_total = 0;

        items.forEach(item => {
            const totalItem = (item.precio_unitario || 0) * (item.cantidad || 0);
            subtotal += totalItem;
            descuento_total += (item.descuento || 0);
        });

        return {
            subtotal,
            descuento_total,
            total: subtotal - descuento_total
        };
    }, []);

    // 💾 Registrar una venta
    const registrarVenta = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Validar datos
            const errores = validarVenta(data);
            if (errores.length > 0) {
                throw new Error(errores.join(', '));
            }

            // 1. Obtener el stock diario activo
            const { data: stockDiario, error: stockError } = await supabase
                .from('stock_diario')
                .select('*')
                .eq('distribuidor_id', data.distribuidor_id)
                .eq('estado', 'activo')
                .maybeSingle();

            if (stockError) throw stockError;
            if (!stockDiario) {
                throw new Error('No hay un día activo. Abre un día primero.');
            }

            // 2. Verificar stock del producto
            let productos = stockDiario.datos?.productos || [];
            const productoIndex = productos.findIndex(p => p.producto_id === data.producto_id);

            if (productoIndex === -1) {
                throw new Error('Producto no encontrado en el stock del día');
            }

            const productoStock = productos[productoIndex];
            const stockActual = productoStock.stock_actual || 0;

            if (data.cantidad > stockActual) {
                throw new Error(`Stock insuficiente. Disponible: ${stockActual}`);
            }

            // 3. Actualizar stock del producto
            const nuevoStockActual = stockActual - data.cantidad;
            productos[productoIndex].stock_actual = nuevoStockActual;

            // 4. Registrar la venta en el historial del día
            const ventaRegistro = {
                producto_id: data.producto_id,
                producto_nombre: productoStock.nombre || '',
                cantidad: data.cantidad,
                precio_unitario: data.precio_unitario,
                descuento: data.descuento || 0,
                total: (data.precio_unitario * data.cantidad) - (data.descuento || 0),
                cliente_id: data.cliente_id || null, // Puede ser null
                cliente_nombre: data.cliente_nombre || 'Cliente Mostrador',
                ruta_id: data.ruta_id || null, // Puede ser null
                fecha: new Date().toISOString()
            };

            // Agregar venta al array de ventas del día
            const ventas = stockDiario.datos?.ventas || [];
            ventas.push(ventaRegistro);

            // 5. Recalcular resumen del día
            const totalProductos = productos.length;
            const stockInicialTotal = productos.reduce((sum, p) => sum + (p.stock_inicial || 0), 0);
            const stockActualTotal = productos.reduce((sum, p) => sum + (p.stock_actual || 0), 0);
            const stockFinalTotal = productos.reduce((sum, p) => sum + (p.stock_final || 0), 0);
            const totalVendido = productos.reduce((sum, p) => sum + ((p.stock_inicial || 0) - (p.stock_actual || 0)), 0);

            // Calcular total efectivo de todas las ventas del día
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

            // 6. Actualizar stock_diario
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

            if (updateError) throw updateError;

            // 7. Registrar la venta en la tabla ventas
            const ventaData = {
                distribuidor_id: data.distribuidor_id,
                cliente_id: data.cliente_id || null, // Puede ser null
                ruta_id: data.ruta_id || null, // Puede ser null
                producto_id: data.producto_id,
                stock_diario_id: stockDiario.id,
                cantidad: data.cantidad,
                subtotal: data.precio_unitario * data.cantidad,
                descuento_total: data.descuento || 0,
                total: (data.precio_unitario * data.cantidad) - (data.descuento || 0),
                observacion: data.observacion || null,
                fecha_venta: new Date().toISOString()
            };

            const { data: ventaCreada, error: ventaError } = await supabase
                .from('ventas')
                .insert([ventaData])
                .select()
                .single();

            if (ventaError) throw ventaError;

            setSuccess(true);
            return {
                venta: ventaCreada,
                stock_actualizado: updatedStock,
                producto_actualizado: productos[productoIndex],
                resumen: resumen
            };
        } catch (error) {
            console.error('Error al registrar venta:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [validarVenta]);

    // 💾 Registrar múltiples ventas (carrito)
    const registrarVentasMultiples = useCallback(async (distribuidorId, items, clienteId, rutaId, observacion = null) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const resultados = [];
            const errores = [];

            for (const item of items) {
                const ventaData = {
                    distribuidor_id: distribuidorId,
                    cliente_id: clienteId || null, // Puede ser null
                    ruta_id: rutaId || null, // Puede ser null
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    descuento: item.descuento || 0,
                    stock_disponible: item.stock_disponible,
                    observacion: observacion,
                    cliente_nombre: item.cliente_nombre || 'Cliente Mostrador'
                };

                const result = await registrarVenta(ventaData);
                if (result) {
                    resultados.push(result);
                } else {
                    errores.push(`Error al vender ${item.nombre || item.producto_id}`);
                }
            }

            if (errores.length > 0) {
                setError(`Se registraron ${resultados.length} ventas. Errores: ${errores.join(', ')}`);
            } else {
                setSuccess(true);
            }

            return resultados;
        } catch (error) {
            console.error('Error al registrar ventas múltiples:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [registrarVenta]);

    // 🔄 Anular una venta (restaurar stock)
    const anularVenta = useCallback(async (ventaId, distribuidorId) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // 1. Obtener la venta
            const { data: venta, error: ventaError } = await supabase
                .from('ventas')
                .select('*')
                .eq('id', ventaId)
                .single();

            if (ventaError) throw ventaError;

            // 2. Obtener el stock diario
            const { data: stockDiario, error: stockError } = await supabase
                .from('stock_diario')
                .select('*')
                .eq('id', venta.stock_diario_id)
                .maybeSingle();

            if (stockError) throw stockError;
            if (!stockDiario) {
                throw new Error('No se encontró el stock diario');
            }

            // 3. Restaurar stock del producto
            let productos = stockDiario.datos?.productos || [];
            const productoIndex = productos.findIndex(p => p.producto_id === venta.producto_id);

            if (productoIndex === -1) {
                throw new Error('Producto no encontrado en el stock');
            }

            productos[productoIndex].stock_actual = (productos[productoIndex].stock_actual || 0) + venta.cantidad;

            // 4. Eliminar la venta del array de ventas del día
            let ventas = stockDiario.datos?.ventas || [];
            ventas = ventas.filter(v => v.producto_id !== venta.producto_id || v.fecha !== venta.fecha_venta);

            // 5. Recalcular resumen
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

            // 6. Actualizar stock_diario
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

            if (updateError) throw updateError;

            // 7. Eliminar la venta de la tabla ventas (o marcar como anulada)
            const { error: deleteError } = await supabase
                .from('ventas')
                .delete()
                .eq('id', ventaId);

            if (deleteError) throw deleteError;

            setSuccess(true);
            return {
                venta_anulada: venta,
                stock_actualizado: updatedStock
            };
        } catch (error) {
            console.error('Error al anular venta:', error);
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
        validarVenta,
        calcularTotales,
        registrarVenta,
        registrarVentasMultiples,
        anularVenta,
        reset: () => {
            setError(null);
            setSuccess(false);
            setLoading(false);
        }
    };
}