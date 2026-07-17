'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useVentas() {
    const [loading, setLoading] = useState(false);
    const [ventas, setVentas] = useState([]);
    const [ventaActual, setVentaActual] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [diaActivo, setDiaActivo] = useState(null); // ✅ Día activo completo
    const [stockProductos, setStockProductos] = useState([]); // ✅ Productos del día activo
    const [rutas, setRutas] = useState([]);
    const [error, setError] = useState(null);
    const [fechaVenta, setFechaVenta] = useState(null);

    // ✅ Obtener el día activo del distribuidor
    const getDiaActivo = useCallback(async (distribuidorId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('stock_diario')
                .select('*')
                .eq('distribuidor_id', distribuidorId)
                .eq('estado', 'activo')
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setDiaActivo(data);
                const productos = data.datos?.productos || [];
                setStockProductos(productos);
                setFechaVenta(data.fecha);
                return data;
            } else {
                setDiaActivo(null);
                setStockProductos([]);
                return null;
            }
        } catch (error) {
            console.error('Error al obtener día activo:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ Verificar si hay un día activo
    const verificarDiaActivo = useCallback(() => {
        return diaActivo !== null;
    }, [diaActivo]);

    // ✅ Verificar si hay stock disponible para un producto
    const verificarStockProducto = useCallback((productoId, cantidad = 1) => {
        if (!diaActivo) {
            return { disponible: false, mensaje: 'No hay un día activo para vender' };
        }

        const stock = stockProductos.find(s => s.producto_id === productoId);
        if (!stock) {
            return {
                disponible: false,
                mensaje: 'Producto no tiene stock registrado para este día',
                stock_actual: 0
            };
        }
        if (stock.stock_actual < cantidad) {
            return {
                disponible: false,
                mensaje: `Stock insuficiente. Disponible: ${stock.stock_actual}, Solicitado: ${cantidad}`,
                stock_actual: stock.stock_actual
            };
        }
        return {
            disponible: true,
            stock_actual: stock.stock_actual,
            producto_stock: stock,
            index: stockProductos.indexOf(stock)
        };
    }, [diaActivo, stockProductos]);

    // ✅ Obtener stock actual para un producto
    const getStockActual = useCallback((productoId) => {
        const stock = stockProductos.find(s => s.producto_id === productoId);
        return stock?.stock_actual || 0;
    }, [stockProductos]);

    // ✅ Obtener todos los productos con stock disponible
    const getProductosConStock = useCallback(() => {
        return stockProductos.filter(s => s.stock_actual > 0);
    }, [stockProductos]);

    // ✅ Establecer fecha de venta
    const setFechaVentaSeleccionada = useCallback((fecha) => {
        setFechaVenta(fecha);
    }, []);

    // Obtener cliente actual (distribuidor)
    const getDistribuidor = useCallback(async (userId) => {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, nombre, usuario, distribucion')
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

    // Obtener todos los productos (sin filtro de stock)
    const getProductos = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('productos')
                .select(`
                    *,
                    categoria: categoria_id (nombre),
                    empresa: empresa_id (nombre, color_primario)
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

    // Obtener rutas del distribuidor
    const getRutasDistribuidor = useCallback(async (distribuidorId) => {
        setLoading(true);
        try {
            const { data: usuario, error: userError } = await supabase
                .from('usuarios')
                .select('distribucion')
                .eq('id', distribuidorId)
                .single();

            if (userError) throw userError;

            if (usuario?.distribucion) {
                const { data: rutasFiltradas, error: rutasError } = await supabase
                    .from('rutas')
                    .select('*')
                    .eq('nombre', usuario.distribucion)
                    .eq('activo', true)
                    .order('nombre', { ascending: true });

                if (rutasError) throw rutasError;

                setRutas(rutasFiltradas || []);
                return rutasFiltradas || [];
            }

            const { data: todasRutas, error: todasError } = await supabase
                .from('rutas')
                .select('*')
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (todasError) throw todasError;

            setRutas(todasRutas || []);
            return todasRutas || [];
        } catch (error) {
            console.error('Error al obtener rutas:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ Crear nueva venta (actualiza el JSONB)
    const crearVenta = useCallback(async (ventaData) => {
        setLoading(true);
        setError(null);

        try {
            if (!diaActivo) {
                throw new Error('No hay un día activo para registrar la venta');
            }

            // Verificar stock
            const stockCheck = verificarStockProducto(ventaData.producto_id, ventaData.cantidad);
            if (!stockCheck.disponible) {
                throw new Error(stockCheck.mensaje);
            }

            // ✅ Registrar la venta en la tabla ventas
            const { data: venta, error: ventaError } = await supabase
                .from('ventas')
                .insert([{
                    distribuidor_id: ventaData.distribuidor_id,
                    cliente_id: ventaData.cliente_id || null,
                    ruta_id: ventaData.ruta_id || null,
                    producto_id: ventaData.producto_id,
                    stock_diario_id: diaActivo.id,
                    cantidad: ventaData.cantidad,
                    fecha_venta: ventaData.fecha_venta || new Date().toISOString(),
                    subtotal: ventaData.subtotal,
                    descuento_total: ventaData.descuento_total || 0,
                    total: ventaData.total,
                    observacion: ventaData.observacion || '',
                }])
                .select()
                .single();

            if (ventaError) throw ventaError;

            // ✅ Actualizar el JSONB en stock_diario
            const nuevosProductos = [...stockProductos];
            const index = stockCheck.index;

            if (index !== undefined && index !== -1) {
                // Actualizar stock_actual del producto
                const productoActualizado = {
                    ...nuevosProductos[index],
                    stock_actual: nuevosProductos[index].stock_actual - ventaData.cantidad
                };
                nuevosProductos[index] = productoActualizado;
            }

            // ✅ Recalcular resumen
            const totalProductos = nuevosProductos.length;
            const stockInicialTotal = nuevosProductos.reduce((sum, p) => sum + (p.stock_inicial || 0), 0);
            const stockActualTotal = nuevosProductos.reduce((sum, p) => sum + (p.stock_actual || 0), 0);
            const totalVendido = nuevosProductos.reduce((sum, p) => sum + ((p.stock_inicial || 0) - (p.stock_actual || 0)), 0);
            const totalEfectivo = nuevosProductos.reduce((sum, p) => sum + ((p.stock_inicial || 0) - (p.stock_actual || 0)) * (p.precio_base || 0), 0);

            // ✅ Agregar venta al historial de ventas del día
            const nuevaVentaHistorial = {
                venta_id: venta.id,
                producto_id: ventaData.producto_id,
                cantidad: ventaData.cantidad,
                total: ventaData.total,
                cliente: ventaData.cliente_nombre || 'Sin cliente',
                fecha: new Date().toISOString()
            };

            const ventasHistorial = diaActivo.datos?.ventas || [];
            ventasHistorial.push(nuevaVentaHistorial);

            // ✅ Construir el nuevo objeto datos
            const nuevosDatos = {
                productos: nuevosProductos,
                resumen: {
                    total_productos: totalProductos,
                    stock_inicial_total: stockInicialTotal,
                    stock_actual_total: stockActualTotal,
                    stock_final_total: 0,
                    total_vendido: totalVendido,
                    total_efectivo: totalEfectivo,
                },
                ventas: ventasHistorial,
            };

            // ✅ Actualizar stock_diario con el nuevo JSONB
            const { data: updatedDia, error: updateError } = await supabase
                .from('stock_diario')
                .update({
                    datos: nuevosDatos,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', diaActivo.id)
                .select()
                .single();

            if (updateError) throw updateError;

            // ✅ Actualizar estado local
            setDiaActivo(updatedDia);
            setStockProductos(nuevosProductos);

            setVentaActual(venta);
            return venta;
        } catch (error) {
            console.error('Error al crear venta:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [diaActivo, stockProductos, verificarStockProducto]);

    // Obtener ventas del día activo
    const getVentasHoy = useCallback(async () => {
        if (!diaActivo) {
            return [];
        }

        const ventasHistorial = diaActivo.datos?.ventas || [];
        setVentas(ventasHistorial);
        return ventasHistorial;
    }, [diaActivo]);

    // Obtener ventas por fecha específica
    const getVentasPorFecha = useCallback(async (distribuidorId, fecha) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ventas')
                .select(`
                    *,
                    cliente: cliente_id (nombre, telefono),
                    producto: producto_id (nombre, codigo, precio_base)
                `)
                .eq('distribuidor_id', distribuidorId)
                .gte('fecha_venta', fecha)
                .lte('fecha_venta', fecha)
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
                    telefono: clienteData.telefono || '',
                    referencia: clienteData.referencia || '',
                    ruta_id: clienteData.ruta_id || null,
                    tipo_cliente_id: clienteData.tipo_cliente_id || null,
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

    // ✅ Resetear todo (al cambiar de día)
    const resetVentas = useCallback(() => {
        setDiaActivo(null);
        setStockProductos([]);
        setVentas([]);
        setVentaActual(null);
        setFechaVenta(null);
    }, []);

    return {
        loading,
        ventas,
        ventaActual,
        clientes,
        productos,
        stockProductos,
        diaActivo,
        rutas,
        error,
        fechaVenta,
        // ✅ Nuevas funciones
        getDiaActivo,
        verificarDiaActivo,
        getStockActual,
        getProductosConStock,
        setFechaVentaSeleccionada,
        resetVentas,
        // ✅ Funciones existentes
        getDistribuidor,
        getClientesPorRuta,
        getProductos,
        getRutasDistribuidor,
        crearVenta,
        getVentasHoy,
        getVentasPorFecha,
        buscarCliente,
        crearClienteRapido,
        calcularTotales,
        setClientes,
        setProductos,
        setRutas,
        setError,
    };
}