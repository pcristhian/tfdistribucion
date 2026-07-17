'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useStockDiario() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // 📦 Obtener stock del día actual para un distribuidor
    const getStockHoy = useCallback(async (distribuidorId) => {
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('stock_diario')
                .select(`
                    *,
                    producto: producto_id (
                        id,
                        nombre,
                        codigo,
                        precio_base,
                        empresa: empresa_id (id, nombre, color_primario)
                    )
                `)
                .eq('distribuidor_id', distribuidorId)
                .eq('fecha', new Date().toISOString().split('T')[0])
                .order('producto(nombre)', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error al obtener stock del día:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // 📦 Obtener stock por fecha específica
    const getStockPorFecha = useCallback(async (distribuidorId, fecha) => {
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('stock_diario')
                .select(`
                    *,
                    producto: producto_id (
                        id,
                        nombre,
                        codigo,
                        precio_base,
                        empresa: empresa_id (id, nombre, color_primario)
                    )
                `)
                .eq('distribuidor_id', distribuidorId)
                .eq('fecha', fecha)
                .order('producto(nombre)', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error al obtener stock por fecha:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔄 Abrir día (registrar stock inicial)
    const abrirDia = useCallback(async (distribuidorId, productos) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const fecha = new Date().toISOString().split('T')[0];
            const registros = productos.map(p => ({
                distribuidor_id: distribuidorId,
                producto_id: p.producto_id,
                fecha: fecha,
                stock_inicial: p.stock_inicial || 0,
                stock_actual: p.stock_inicial || 0,
                stock_final: 0,
            }));

            const { data, error } = await supabase
                .from('stock_diario')
                .upsert(registros, {
                    onConflict: 'distribuidor_id, producto_id, fecha',
                    ignoreDuplicates: false,
                })
                .select();

            if (error) throw error;

            setSuccess(true);
            return data;
        } catch (error) {
            console.error('Error al abrir día:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 💰 Crear venta (reduce stock_actual)
    const crearVenta = useCallback(async (ventaData) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // 1. Verificar stock disponible
            const { data: stock, error: stockError } = await supabase
                .from('stock_diario')
                .select('id, stock_actual, producto_id')
                .eq('id', ventaData.stock_diario_id)
                .single();

            if (stockError) throw stockError;

            if (!stock) {
                throw new Error('Stock no encontrado');
            }

            if (stock.stock_actual < ventaData.cantidad) {
                throw new Error(`Stock insuficiente. Disponible: ${stock.stock_actual}, Solicitado: ${ventaData.cantidad}`);
            }

            // 2. Registrar la venta
            const { data: venta, error: ventaError } = await supabase
                .from('ventas')
                .insert([{
                    distribuidor_id: ventaData.distribuidor_id,
                    cliente_id: ventaData.cliente_id,
                    ruta_id: ventaData.ruta_id,
                    producto_id: ventaData.producto_id,
                    stock_diario_id: ventaData.stock_diario_id,
                    cantidad: ventaData.cantidad,
                    subtotal: ventaData.subtotal,
                    descuento_total: ventaData.descuento_total || 0,
                    total: ventaData.total,
                    observacion: ventaData.observacion || '',
                }])
                .select()
                .single();

            if (ventaError) throw ventaError;

            // 3. Actualizar stock_actual (el trigger lo hará automáticamente)
            // Pero por si acaso, lo hacemos manual también
            const nuevoStock = stock.stock_actual - ventaData.cantidad;
            const { error: updateError } = await supabase
                .from('stock_diario')
                .update({
                    stock_actual: nuevoStock,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', ventaData.stock_diario_id);

            if (updateError) throw updateError;

            setSuccess(true);
            return venta;
        } catch (error) {
            console.error('Error al crear venta:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔄 Anular venta (restaura stock_actual)
    const anularVenta = useCallback(async (ventaId) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // 1. Obtener la venta con su stock_diario_id y cantidad
            const { data: venta, error: ventaError } = await supabase
                .from('ventas')
                .select('id, stock_diario_id, cantidad, producto_id, distribuidor_id')
                .eq('id', ventaId)
                .single();

            if (ventaError) throw ventaError;

            if (!venta) {
                throw new Error('Venta no encontrada');
            }

            if (!venta.stock_diario_id) {
                throw new Error('Esta venta no tiene stock asociado');
            }

            // 2. Obtener stock actual
            const { data: stock, error: stockError } = await supabase
                .from('stock_diario')
                .select('id, stock_actual')
                .eq('id', venta.stock_diario_id)
                .single();

            if (stockError) throw stockError;

            // 3. Restaurar stock
            const nuevoStock = stock.stock_actual + venta.cantidad;
            const { error: updateError } = await supabase
                .from('stock_diario')
                .update({
                    stock_actual: nuevoStock,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', venta.stock_diario_id);

            if (updateError) throw updateError;

            // 4. Marcar la venta como anulada (soft delete o actualizar estado)
            const { error: anularError } = await supabase
                .from('ventas')
                .update({
                    observacion: `ANULADA - ${new Date().toISOString()}`,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', ventaId);

            if (anularError) throw anularError;

            setSuccess(true);
            return { ventaAnulada: venta, stockRestaurado: nuevoStock };
        } catch (error) {
            console.error('Error al anular venta:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔄 Cerrar día (calcular stock_final)
    const cerrarDia = useCallback(async (distribuidorId, fecha) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const fechaObj = fecha || new Date().toISOString().split('T')[0];

            // Actualizar stock_final = stock_actual para todos los productos del día
            const { data, error } = await supabase
                .from('stock_diario')
                .update({
                    stock_final: supabase.raw('stock_actual'),
                    updated_at: new Date().toISOString(),
                })
                .eq('distribuidor_id', distribuidorId)
                .eq('fecha', fechaObj)
                .select();

            if (error) throw error;

            setSuccess(true);
            return data;
        } catch (error) {
            console.error('Error al cerrar día:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 📊 Verificar si el día está abierto (tiene stock registrado)
    const verificarDiaAbierto = useCallback(async (distribuidorId) => {
        try {
            const fecha = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('stock_diario')
                .select('id', { count: 'exact', head: true })
                .eq('distribuidor_id', distribuidorId)
                .eq('fecha', fecha);

            if (error) throw error;
            return (data?.length || 0) > 0;
        } catch (error) {
            console.error('Error al verificar día abierto:', error);
            return false;
        }
    }, []);

    // 📊 Obtener resumen del día
    const getResumenDia = useCallback(async (distribuidorId) => {
        try {
            const fecha = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('stock_diario')
                .select(`
                    *,
                    producto: producto_id (
                        id,
                        nombre,
                        codigo,
                        precio_base,
                        empresa: empresa_id (id, nombre, color_primario)
                    )
                `)
                .eq('distribuidor_id', distribuidorId)
                .eq('fecha', fecha)
                .order('producto(nombre)', { ascending: true });

            if (error) throw error;

            const resumen = {
                totalProductos: data?.length || 0,
                stockTotalInicial: data?.reduce((sum, item) => sum + (item.stock_inicial || 0), 0) || 0,
                stockTotalActual: data?.reduce((sum, item) => sum + (item.stock_actual || 0), 0) || 0,
                stockTotalVendido: data?.reduce((sum, item) => sum + ((item.stock_inicial || 0) - (item.stock_actual || 0)), 0) || 0,
                productos: data || [],
            };

            return resumen;
        } catch (error) {
            console.error('Error al obtener resumen del día:', error);
            return null;
        }
    }, []);

    return {
        loading,
        error,
        success,
        getStockHoy,
        getStockPorFecha,
        abrirDia,
        crearVenta,
        anularVenta,
        cerrarDia,
        verificarDiaAbierto,
        getResumenDia,
        reset: () => {
            setError(null);
            setSuccess(false);
            setLoading(false);
        },
    };
}