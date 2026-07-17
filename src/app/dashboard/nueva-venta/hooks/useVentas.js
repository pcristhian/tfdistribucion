'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useVentas() {
    const [loading, setLoading] = useState(false);
    const [ventas, setVentas] = useState([]);
    const [ventaActual, setVentaActual] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [combos, setCombos] = useState([]);
    const [rutas, setRutas] = useState([]);
    const [error, setError] = useState(null);

    // Obtener cliente actual (distribuidor)
    const getDistribuidor = useCallback(async (userId) => {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, nombre, usuario, distribucion, ruta_id')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener distribuidor:', error);
            return null;
        }
    }, []);

    // Obtener clientes por ruta
    const getClientesPorRuta = useCallback(async (rutaId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .eq('ruta_id', rutaId)
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            setClientes(data);
            return data;
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener productos activos
    const getProductos = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('productos')
                .select(`
                    *,
                    categoria: categoria_id (nombre),
                    empresa: empresa_id (nombre)
                `)
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            setProductos(data);
            return data;
        } catch (error) {
            console.error('Error al obtener productos:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener combos activos
    const getCombos = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('combos')
                .select(`
                    *,
                    combo_productos (
                        producto_id,
                        cantidad,
                        precio_unitario,
                        producto: producto_id (nombre, precio_base)
                    )
                `)
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            setCombos(data);
            return data;
        } catch (error) {
            console.error('Error al obtener combos:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener rutas del distribuidor
    const getRutasDistribuidor = useCallback(async (distribuidorId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('distribuidor_ruta')
                .select(`
                    ruta: ruta_id (
                        id, 
                        nombre, 
                        ciudad, 
                        zona
                    )
                `)
                .eq('distribuidor_id', distribuidorId)
                .eq('activo', true);

            if (error) throw error;
            const rutas = data.map(item => item.ruta).filter(r => r !== null);
            setRutas(rutas);
            return rutas;
        } catch (error) {
            console.error('Error al obtener rutas:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear nueva venta
    const crearVenta = useCallback(async (ventaData) => {
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('ventas')
                .insert([{
                    distribuidor_id: ventaData.distribuidor_id,
                    cliente_id: ventaData.cliente_id,
                    ruta_id: ventaData.ruta_id,
                    subtotal: ventaData.subtotal,
                    descuento_total: ventaData.descuento_total || 0,
                    total: ventaData.total,
                    metodo_pago: ventaData.metodo_pago || 'efectivo',
                    estado_pago: ventaData.estado_pago || 'pagado',
                    tipo_venta: ventaData.tipo_venta || 'venta',
                    observacion: ventaData.observacion || '',
                }])
                .select()
                .single();

            if (error) throw error;
            setVentaActual(data);
            return data;
        } catch (error) {
            console.error('Error al crear venta:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear detalles de venta
    const crearDetallesVenta = useCallback(async (ventaId, detalles) => {
        setLoading(true);
        setError(null);

        try {
            const detallesData = detalles.map(detalle => ({
                venta_id: ventaId,
                producto_id: detalle.producto_id || null,
                combo_id: detalle.combo_id || null,
                cantidad: detalle.cantidad,
                precio_unitario: detalle.precio_unitario,
                descuento_unitario: detalle.descuento_unitario || 0,
                subtotal: detalle.subtotal,
                total: detalle.total,
            }));

            const { data, error } = await supabase
                .from('venta_detalles')
                .insert(detallesData)
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al crear detalles:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener ventas del día
    const getVentasHoy = useCallback(async (distribuidorId) => {
        setLoading(true);
        try {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('ventas')
                .select(`
                    *,
                    cliente: cliente_id (nombre, apellido, telefono),
                    venta_detalles (
                        *,
                        producto: producto_id (nombre),
                        combo: combo_id (nombre)
                    )
                `)
                .eq('distribuidor_id', distribuidorId)
                .gte('fecha_venta', hoy.toISOString())
                .order('fecha_venta', { ascending: false });

            if (error) throw error;
            setVentas(data);
            return data;
        } catch (error) {
            console.error('Error al obtener ventas de hoy:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener ventas por fecha
    const getVentasPorFecha = useCallback(async (distribuidorId, fechaInicio, fechaFin) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ventas')
                .select(`
                    *,
                    cliente: cliente_id (nombre, apellido, telefono),
                    venta_detalles (
                        *,
                        producto: producto_id (nombre),
                        combo: combo_id (nombre)
                    )
                `)
                .eq('distribuidor_id', distribuidorId)
                .gte('fecha_venta', fechaInicio)
                .lte('fecha_venta', fechaFin)
                .order('fecha_venta', { ascending: false });

            if (error) throw error;
            setVentas(data);
            return data;
        } catch (error) {
            console.error('Error al obtener ventas por fecha:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Buscar cliente por nombre o teléfono
    const buscarCliente = useCallback(async (termino) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .or(`nombre.ilike.%${termino}%,telefono.ilike.%${termino}%`)
                .eq('activo', true)
                .limit(10);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al buscar cliente:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear nuevo cliente rápido
    const crearClienteRapido = useCallback(async (clienteData) => {
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('clientes')
                .insert([{
                    nombre: clienteData.nombre,
                    apellido: clienteData.apellido || '',
                    telefono: clienteData.telefono || '',
                    ruta_id: clienteData.ruta_id,
                    tipo_cliente: clienteData.tipo_cliente || 'regular',
                    activo: true,
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al crear cliente:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Calcular totales de venta
    const calcularTotales = useCallback((items) => {
        let subtotal = 0;
        let descuentoTotal = 0;

        items.forEach(item => {
            const precio = item.precio_unitario || 0;
            const cantidad = item.cantidad || 0;
            const descuento = item.descuento_unitario || 0;

            subtotal += precio * cantidad;
            descuentoTotal += descuento * cantidad;
        });

        const total = subtotal - descuentoTotal;

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            descuentoTotal: parseFloat(descuentoTotal.toFixed(2)),
            total: parseFloat(total.toFixed(2))
        };
    }, []);

    return {
        loading,
        ventas,
        ventaActual,
        clientes,
        productos,
        combos,
        rutas,
        error,
        getDistribuidor,
        getClientesPorRuta,
        getProductos,
        getCombos,
        getRutasDistribuidor,
        crearVenta,
        crearDetallesVenta,
        getVentasHoy,
        getVentasPorFecha,
        buscarCliente,
        crearClienteRapido,
        calcularTotales,
        setClientes,
        setProductos,
        setCombos,
        setRutas,
        setError,
    };
}