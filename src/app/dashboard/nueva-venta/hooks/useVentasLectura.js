// app/dashboard/ventas/hooks/useVentasLectura.js
'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useVentasLectura() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 📊 Obtener el día activo para un distribuidor
    const getDiaActivo = useCallback(async (distribuidorId) => {
        try {
            const { data, error } = await supabase
                .from('stock_diario')
                .select('*')
                .eq('distribuidor_id', distribuidorId)
                .eq('estado', 'activo')
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener día activo:', error);
            setError(error.message);
            return null;
        }
    }, []);

    // 📊 Verificar si hay múltiples días activos
    const verificarMultiplesDiasActivos = useCallback(async (distribuidorId) => {
        try {
            const { data, error, count } = await supabase
                .from('stock_diario')
                .select('id, fecha', { count: 'exact' })
                .eq('distribuidor_id', distribuidorId)
                .eq('estado', 'activo');

            if (error) throw error;

            return {
                tieneMultiples: (count || 0) > 1,
                count: count || 0,
                dias: data || []
            };
        } catch (error) {
            console.error('Error al verificar días activos:', error);
            return { tieneMultiples: false, count: 0, dias: [] };
        }
    }, []);

    // 📊 Obtener productos con stock del día activo
    const getProductosConStock = useCallback(async (distribuidorId) => {
        setLoading(true);
        setError(null);

        try {
            // Primero obtener el día activo
            const diaActivo = await getDiaActivo(distribuidorId);

            if (!diaActivo) {
                setError('No hay un día activo. Abre un día primero.');
                return null;
            }

            // Verificar si hay múltiples días activos
            const { tieneMultiples, count, dias } = await verificarMultiplesDiasActivos(distribuidorId);

            if (tieneMultiples) {
                setError(`⚠️ Hay ${count} días activos. Solo debe haber uno. Contacta al administrador.`);
                return {
                    error: 'multiples_dias_activos',
                    dias: dias,
                    mensaje: `Hay ${count} días activos: ${dias.map(d => d.fecha).join(', ')}`
                };
            }

            // Obtener productos del stock
            const productos = diaActivo.datos?.productos || [];

            // Obtener información completa de los productos (empresa, categoría, etc.)
            const productoIds = productos.map(p => p.producto_id).filter(id => id);

            if (productoIds.length === 0) {
                return {
                    diaActivo: diaActivo,
                    productos: [],
                    resumen: diaActivo.datos?.resumen || {}
                };
            }

            const { data: productosInfo, error: prodError } = await supabase
                .from('productos')
                .select(`
                    *,
                    empresa:empresa_id (id, nombre, color_primario),
                    categoria:categoria_id (id, nombre)
                `)
                .in('id', productoIds)
                .eq('activo', true);

            if (prodError) throw prodError;

            // Combinar stock con información del producto
            const productosConInfo = productos.map(item => {
                const info = productosInfo?.find(p => p.id === item.producto_id);
                return {
                    ...item,
                    producto: info || null,
                    stock_disponible: item.stock_actual || 0,
                    nombre: info?.nombre || item.nombre || 'Producto no encontrado',
                    codigo: info?.codigo || item.codigo || '',
                    empresa: info?.empresa || { nombre: item.empresa || '', color_primario: item.empresa_color || '#6366f1' },
                    precio_base: info?.precio_base || item.precio_base || 0,
                };
            });

            return {
                diaActivo: diaActivo,
                productos: productosConInfo,
                resumen: diaActivo.datos?.resumen || {},
                tieneMultiples: tieneMultiples
            };
        } catch (error) {
            console.error('Error al obtener productos con stock:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [getDiaActivo, verificarMultiplesDiasActivos]);

    // ✅ Obtener precio de un producto específico según la ruta
    const getPrecioProductoPorRuta = useCallback(async (productoId, rutaId) => {
        try {
            if (!productoId) return 0;

            // Si no hay ruta, usar precio_base del producto
            if (!rutaId) {
                const { data, error } = await supabase
                    .from('productos')
                    .select('precio_base')
                    .eq('id', productoId)
                    .single();

                if (error) throw error;
                return data?.precio_base || 0;
            }

            // Buscar precio en precios_ruta
            const { data, error } = await supabase
                .from('precios_ruta')
                .select('precio_base, precio_minimo, precio_costo')
                .eq('ruta_id', rutaId)
                .eq('producto_id', productoId)
                .maybeSingle();

            if (error) throw error;

            // Si existe precio para esta ruta, usarlo
            if (data) {
                return data.precio_base;
            }

            // Si no existe, usar precio_base del producto
            const { data: producto, error: prodError } = await supabase
                .from('productos')
                .select('precio_base')
                .eq('id', productoId)
                .single();

            if (prodError) throw prodError;
            return producto?.precio_base || 0;

        } catch (error) {
            console.error('Error al obtener precio por ruta:', error);
            return 0;
        }
    }, []);

    // 📊 Obtener precios por ruta para los productos
    const getPreciosPorRuta = useCallback(async (rutaId, productoIds) => {
        if (!rutaId || !productoIds || productoIds.length === 0) {
            return {};
        }

        try {
            const { data, error } = await supabase
                .from('precios_ruta')
                .select('producto_id, precio_base, precio_minimo, precio_costo')
                .eq('ruta_id', rutaId)
                .in('producto_id', productoIds);

            if (error) throw error;

            // Convertir a objeto para acceso rápido
            const preciosMap = {};
            data.forEach(item => {
                preciosMap[item.producto_id] = {
                    precio_base: item.precio_base,
                    precio_minimo: item.precio_minimo,
                    precio_costo: item.precio_costo,
                };
            });

            return preciosMap;
        } catch (error) {
            console.error('Error al obtener precios por ruta:', error);
            return {};
        }
    }, []);

    // 📊 Obtener datos completos para ventas (stock + precios por ruta)
    const getDatosParaVentas = useCallback(async (distribuidorId, rutaId) => {
        setLoading(true);
        setError(null);

        try {
            // 1. Obtener productos con stock
            const stockData = await getProductosConStock(distribuidorId);

            if (!stockData || stockData.error) {
                return stockData;
            }

            // 2. Si no hay productos, retornar
            if (stockData.productos.length === 0) {
                return {
                    ...stockData,
                    precios: {},
                    productosConPrecio: []
                };
            }

            // 3. Obtener precios por ruta
            const productoIds = stockData.productos.map(p => p.producto_id);
            const precios = await getPreciosPorRuta(rutaId, productoIds);

            // 4. Para productos sin precio en ruta, obtener precio_base del producto
            const productosConPrecio = await Promise.all(stockData.productos.map(async (producto) => {
                const precioRuta = precios[producto.producto_id];

                // Si no hay precio en ruta, obtener el precio_base del producto
                if (!precioRuta && rutaId) {
                    const precioBase = await getPrecioProductoPorRuta(producto.producto_id, rutaId);
                    return {
                        ...producto,
                        precio_venta: precioBase,
                        precio_minimo: producto.precio_minimo || null,
                        precio_costo: producto.precio_costo || 0,
                        tiene_precio_personalizado: false
                    };
                }

                return {
                    ...producto,
                    precio_venta: precioRuta?.precio_base || producto.precio_base || 0,
                    precio_minimo: precioRuta?.precio_minimo || producto.precio_minimo || null,
                    precio_costo: precioRuta?.precio_costo || producto.precio_costo || 0,
                    tiene_precio_personalizado: !!precioRuta
                };
            }));

            return {
                ...stockData,
                precios: precios,
                productosConPrecio: productosConPrecio,
                rutaId: rutaId
            };
        } catch (error) {
            console.error('Error al obtener datos para ventas:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [getProductosConStock, getPreciosPorRuta, getPrecioProductoPorRuta]);

    // 📊 Obtener clientes por ruta
    const getClientesPorRuta = useCallback(async (rutaId) => {
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('id, nombre, telefono, referencia, tipo_cliente')
                .eq('ruta_id', rutaId)
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            return [];
        }
    }, []);

    // 📊 Obtener rutas activas del distribuidor (si tiene asignadas)
    const getRutasDisponibles = useCallback(async (distribuidorId) => {
        try {
            // Por ahora, todas las rutas activas
            const { data, error } = await supabase
                .from('rutas')
                .select('id, nombre, ciudad, zona')
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener rutas:', error);
            return [];
        }
    }, []);

    // 🔍 Buscar cliente por nombre o teléfono
    const buscarCliente = useCallback(async (termino, rutaId) => {
        if (!termino || termino.length < 2) return [];

        try {
            let query = supabase
                .from('clientes')
                .select('id, nombre, telefono, referencia, tipo_cliente')
                .eq('activo', true);

            if (rutaId) {
                query = query.eq('ruta_id', rutaId);
            }

            query = query.or(`nombre.ilike.%${termino}%, telefono.ilike.%${termino}%`)
                .limit(10);

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al buscar cliente:', error);
            return [];
        }
    }, []);

    // 🆕 Crear cliente rápido
    const crearClienteRapido = useCallback(async (nombre, telefono, rutaId) => {
        try {
            const { data, error } = await supabase
                .from('clientes')
                .insert([{
                    nombre: nombre.trim(),
                    telefono: telefono?.trim() || null,
                    ruta_id: rutaId,
                    activo: true,
                    tipo_cliente: 'regular'
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al crear cliente rápido:', error);
            return null;
        }
    }, []);

    return {
        loading,
        error,
        getDiaActivo,
        verificarMultiplesDiasActivos,
        getProductosConStock,
        getPrecioProductoPorRuta, // ✅ Nueva función
        getPreciosPorRuta,
        getDatosParaVentas,
        getClientesPorRuta,
        getRutasDisponibles,
        buscarCliente,
        crearClienteRapido,
        reset: () => {
            setError(null);
            setLoading(false);
        }
    };
}