// app/dashboard/mi-stock-hoy/hooks/useStockDiario.js
'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getBoliviaDateString } from '@/lib/boliviaTime'; // ✅ Importar la función

export function useStockDiario() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // 📦 Obtener stock por fecha específica (o día activo)
    const getStockPorFecha = useCallback(async (distribuidorId, fecha) => {
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('stock_diario')
                .select('*')
                .eq('distribuidor_id', distribuidorId)
                .eq('fecha', fecha)
                .maybeSingle();

            if (error) throw error;

            if (!data) return null;

            return {
                id: data.id,
                distribuidor_id: data.distribuidor_id,
                fecha: data.fecha,
                estado: data.estado,
                productos: data.datos?.productos || [],
                resumen: data.datos?.resumen || {},
                ventas: data.datos?.ventas || [],
                created_at: data.created_at,
                updated_at: data.updated_at,
            };
        } catch (error) {
            console.error('Error al obtener stock por fecha:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 📦 Obtener stock del día actual (CORREGIDO)
    const getStockHoy = useCallback(async (distribuidorId) => {
        setLoading(true);
        setError(null);

        try {
            const hoy = getBoliviaDateString(); // ✅ Ahora sí existe
            return await getStockPorFecha(distribuidorId, hoy);
        } catch (error) {
            console.error('Error al obtener stock del día:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [getStockPorFecha]);

    // 🔄 Abrir día (CORREGIDO - con variables bien definidas)
    const abrirDia = useCallback(async (distribuidorId, productos, fecha = null) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // ✅ Obtener fecha en Bolivia (UTC-4)
            let fechaDia;
            if (fecha) {
                fechaDia = fecha;
            } else {
                fechaDia = getBoliviaDateString();
            }

            // ✅ Obtener el mes y año de la fecha seleccionada
            const fechaObj = new Date(fechaDia);
            const year = fechaObj.getFullYear();
            const month = fechaObj.getMonth();
            const totalDias = new Date(year, month + 1, 0).getDate();

            // ✅ Preparar datos para TODOS los días del mes
            const productosData = productos.map(p => ({
                producto_id: p.producto_id,
                codigo: p.codigo || '',
                nombre: p.nombre || '',
                stock_inicial: p.stock_inicial || 0,
                stock_actual: p.stock_inicial || 0,
                stock_final: 0,
                precio_base: p.precio_base || 0,
                empresa: p.empresa || '',
                empresa_color: p.empresa_color || '#6366f1',
            }));

            const totalProductos = productosData.length;
            const stockInicialTotal = productosData.reduce((sum, p) => sum + p.stock_inicial, 0);
            const stockActualTotal = productosData.reduce((sum, p) => sum + p.stock_actual, 0);

            const datos = {
                productos: productosData,
                resumen: {
                    total_productos: totalProductos,
                    stock_inicial_total: stockInicialTotal,
                    stock_actual_total: stockActualTotal,
                    stock_final_total: 0,
                    total_vendido: 0,
                    total_efectivo: 0,
                },
                ventas: [],
            };

            // ✅ Verificar si ya existen registros para este mes
            const primerDia = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const ultimoDia = `${year}-${String(month + 1).padStart(2, '0')}-${String(totalDias).padStart(2, '0')}`;

            const { data: existingRecords, error: checkError } = await supabase
                .from('stock_diario')
                .select('fecha, estado')
                .eq('distribuidor_id', distribuidorId)
                .gte('fecha', primerDia)
                .lte('fecha', ultimoDia);

            if (checkError) throw checkError;

            // ✅ Si ya existen registros, actualizar en lugar de insertar
            if (existingRecords && existingRecords.length > 0) {
                // Desactivar todos los días del mes
                await supabase
                    .from('stock_diario')
                    .update({
                        estado: 'inactivo',
                        updated_at: new Date().toISOString()
                    })
                    .eq('distribuidor_id', distribuidorId)
                    .gte('fecha', primerDia)
                    .lte('fecha', ultimoDia);

                // Activar solo el día seleccionado y actualizar sus datos
                const { data: updated, error: updateError } = await supabase
                    .from('stock_diario')
                    .update({
                        estado: 'activo',
                        datos: datos,
                        updated_at: new Date().toISOString()
                    })
                    .eq('distribuidor_id', distribuidorId)
                    .eq('fecha', fechaDia)
                    .select()
                    .single();

                if (updateError) throw updateError;

                setSuccess(true);
                return updated;
            }

            // ✅ No existen registros, crear todos los días del mes
            const diasDelMes = [];
            for (let dia = 1; dia <= totalDias; dia++) {
                const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const esDiaSeleccionado = fechaStr === fechaDia;

                diasDelMes.push({
                    distribuidor_id: distribuidorId,
                    fecha: fechaStr,
                    estado: esDiaSeleccionado ? 'activo' : 'inactivo',
                    datos: esDiaSeleccionado ? datos : {
                        productos: [],
                        resumen: {
                            total_productos: 0,
                            stock_inicial_total: 0,
                            stock_actual_total: 0,
                            stock_final_total: 0,
                            total_vendido: 0,
                            total_efectivo: 0
                        },
                        ventas: []
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });
            }

            // ✅ Insertar todos los días del mes
            const { data, error } = await supabase
                .from('stock_diario')
                .insert(diasDelMes)
                .select();

            if (error) throw error;

            // ✅ Buscar el día activo para retornarlo
            const diaActivo = data.find(d => d.estado === 'activo');

            setSuccess(true);
            return diaActivo || data[0];
        } catch (error) {
            console.error('Error al abrir día:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔄 Actualizar stock de un producto específico (CORREGIDO - con fecha Bolivia)
    const actualizarStockProducto = useCallback(async (distribuidorId, productoId, nuevoStock, fecha = null) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // ✅ Usar fecha Bolivia si no se proporciona una
            let fechaDia;
            if (fecha) {
                fechaDia = fecha;
            } else {
                fechaDia = getBoliviaDateString();
            }

            // ✅ Obtener el registro existente para esta fecha
            let { data: dia, error: getError } = await supabase
                .from('stock_diario')
                .select('*')
                .eq('distribuidor_id', distribuidorId)
                .eq('fecha', fechaDia)
                .maybeSingle();

            if (getError) throw getError;

            // ✅ Obtener datos del producto
            const { data: producto, error: prodError } = await supabase
                .from('productos')
                .select(`
                    *,
                    empresa: empresa_id (nombre, color_primario)
                `)
                .eq('id', productoId)
                .single();

            if (prodError) throw prodError;

            const nuevoProducto = {
                producto_id: productoId,
                codigo: producto.codigo || '',
                nombre: producto.nombre || '',
                stock_inicial: nuevoStock || 0,
                stock_actual: nuevoStock || 0,
                stock_final: 0,
                precio_base: producto.precio_base || 0,
                empresa: producto.empresa?.nombre || '',
                empresa_color: producto.empresa?.color_primario || '#6366f1',
            };

            let datos;
            let productos;

            if (!dia) {
                // ✅ Crear nuevo registro
                datos = {
                    productos: [nuevoProducto],
                    resumen: {
                        total_productos: 1,
                        stock_inicial_total: nuevoStock || 0,
                        stock_actual_total: nuevoStock || 0,
                        stock_final_total: 0,
                        total_vendido: 0,
                        total_efectivo: 0,
                    },
                    ventas: [],
                };

                const { data, error } = await supabase
                    .from('stock_diario')
                    .insert([{
                        distribuidor_id: distribuidorId,
                        fecha: fechaDia,
                        estado: 'inactivo',
                        datos: datos,
                    }])
                    .select()
                    .single();

                if (error) throw error;
                setSuccess(true);
                return data;
            }

            // ✅ Actualizar registro existente
            productos = dia.datos?.productos || [];

            // Buscar y actualizar el producto
            const index = productos.findIndex(p => p.producto_id === productoId);
            if (index === -1) {
                productos.push(nuevoProducto);
            } else {
                productos[index].stock_inicial = nuevoStock;
                productos[index].stock_actual = nuevoStock;
                productos[index].stock_final = 0;
            }

            // Recalcular resumen
            const totalProductos = productos.length;
            const stockInicialTotal = productos.reduce((sum, p) => sum + (p.stock_inicial || 0), 0);
            const stockActualTotal = productos.reduce((sum, p) => sum + (p.stock_actual || 0), 0);

            datos = dia.datos || {};
            datos.productos = productos;
            datos.resumen = {
                total_productos: totalProductos,
                stock_inicial_total: stockInicialTotal,
                stock_actual_total: stockActualTotal,
                stock_final_total: 0,
                total_vendido: 0,
                total_efectivo: 0,
            };

            // Guardar cambios (mantener el estado actual)
            const { data, error } = await supabase
                .from('stock_diario')
                .update({
                    datos: datos,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', dia.id)
                .select()
                .single();

            if (error) throw error;

            setSuccess(true);
            return data;
        } catch (error) {
            console.error('Error al actualizar stock:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔄 Crear nuevo producto en el stock del día
    const crearStockDiario = useCallback(async (distribuidorId, productoId, fecha, stockInicial) => {
        return await actualizarStockProducto(distribuidorId, productoId, stockInicial || 0, fecha);
    }, [actualizarStockProducto]);

    // 🟢 Verificar si hay un día activo
    const verificarDiaAbierto = useCallback(async (distribuidorId) => {
        try {
            const { data, error } = await supabase
                .from('stock_diario')
                .select('id', { count: 'exact', head: true })
                .eq('distribuidor_id', distribuidorId)
                .eq('estado', 'activo');

            if (error) throw error;
            return (data?.length || 0) > 0;
        } catch (error) {
            console.error('Error al verificar día abierto:', error);
            return false;
        }
    }, []);

    // 📊 Obtener resumen del día (CORREGIDO - con fecha Bolivia)
    const getResumenDia = useCallback(async (distribuidorId) => {
        try {
            const hoy = getBoliviaDateString();
            const { data, error } = await supabase
                .from('stock_diario')
                .select('datos')
                .eq('distribuidor_id', distribuidorId)
                .eq('fecha', hoy)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                return {
                    totalProductos: 0,
                    stockTotalInicial: 0,
                    stockTotalActual: 0,
                    stockTotalVendido: 0,
                    productos: [],
                };
            }

            const resumen = data.datos?.resumen || {};
            const productos = data.datos?.productos || [];

            return {
                totalProductos: resumen.total_productos || 0,
                stockTotalInicial: resumen.stock_inicial_total || 0,
                stockTotalActual: resumen.stock_actual_total || 0,
                stockTotalVendido: resumen.total_vendido || 0,
                productos: productos,
            };
        } catch (error) {
            console.error('Error al obtener resumen del día:', error);
            return null;
        }
    }, []);

    // 🔄 Cerrar día
    const cerrarDia = useCallback(async (distribuidorId) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { data: diaActivo, error: getError } = await supabase
                .from('stock_diario')
                .select('datos')
                .eq('distribuidor_id', distribuidorId)
                .eq('estado', 'activo')
                .maybeSingle();

            if (getError) throw getError;
            if (!diaActivo) {
                throw new Error('No hay un día activo para cerrar');
            }

            let datos = diaActivo.datos;
            let productos = datos.productos || [];

            productos = productos.map(p => ({
                ...p,
                stock_final: p.stock_actual || 0,
            }));

            const totalProductos = productos.length;
            const stockInicialTotal = productos.reduce((sum, p) => sum + (p.stock_inicial || 0), 0);
            const stockActualTotal = productos.reduce((sum, p) => sum + (p.stock_actual || 0), 0);
            const stockFinalTotal = productos.reduce((sum, p) => sum + (p.stock_final || 0), 0);
            const totalVendido = productos.reduce((sum, p) => sum + ((p.stock_inicial || 0) - (p.stock_actual || 0)), 0);
            const totalEfectivo = productos.reduce((sum, p) => sum + ((p.stock_inicial || 0) - (p.stock_actual || 0)) * (p.precio_base || 0), 0);

            datos.productos = productos;
            datos.resumen = {
                total_productos: totalProductos,
                stock_inicial_total: stockInicialTotal,
                stock_actual_total: stockActualTotal,
                stock_final_total: stockFinalTotal,
                total_vendido: totalVendido,
                total_efectivo: totalEfectivo,
            };

            const { data, error } = await supabase
                .from('stock_diario')
                .update({
                    estado: 'cerrado',
                    datos: datos,
                    updated_at: new Date().toISOString(),
                })
                .eq('distribuidor_id', distribuidorId)
                .eq('estado', 'activo')
                .select()
                .single();

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

    return {
        loading,
        error,
        success,
        getStockPorFecha,
        getStockHoy,
        abrirDia,
        actualizarStockProducto,
        crearStockDiario,
        verificarDiaAbierto,
        getResumenDia,
        cerrarDia,
        reset: () => {
            setError(null);
            setSuccess(false);
            setLoading(false);
        },
    };
}