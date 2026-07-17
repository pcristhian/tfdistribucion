// app/dashboard/precios-ruta/hooks/usePreciosRuta.js
'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function usePreciosRuta() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // 📊 Obtener todas las rutas activas
    const getRutas = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('rutas')
                .select('id, nombre, descripcion, ciudad, zona, activo')
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener rutas:', error);
            setError(error.message);
            return [];
        }
    }, []);

    // 📊 Obtener todos los productos activos con sus precios por defecto
    const getProductos = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select(`
                    *,
                    empresa:empresa_id (id, nombre, color_primario),
                    categoria:categoria_id (id, nombre)
                `)
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener productos:', error);
            setError(error.message);
            return [];
        }
    }, []);

    // 📊 Obtener precios de una ruta específica
    const getPreciosByRuta = useCallback(async (rutaId) => {
        try {
            const { data, error } = await supabase
                .from('precios_ruta')
                .select('*')
                .eq('ruta_id', rutaId);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener precios de ruta:', error);
            setError(error.message);
            return [];
        }
    }, []);

    // 📊 Obtener productos con sus precios (combinando productos + precios de ruta)
    const getProductosConPrecios = useCallback(async (rutaId) => {
        setLoading(true);
        setError(null);

        try {
            // Obtener todos los productos activos
            const productos = await getProductos();

            // Si no hay ruta, solo devolver productos sin precios personalizados
            if (!rutaId) {
                return productos.map(p => ({
                    ...p,
                    precio_ruta: null,
                    tiene_precio_personalizado: false
                }));
            }

            // Obtener precios de la ruta
            const precios = await getPreciosByRuta(rutaId);

            // Combinar productos con precios
            const resultado = productos.map(producto => {
                const precioExistente = precios.find(p => p.producto_id === producto.id);
                return {
                    ...producto,
                    precio_ruta: precioExistente || null,
                    tiene_precio_personalizado: !!precioExistente
                };
            });

            return resultado;
        } catch (error) {
            console.error('Error al obtener productos con precios:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [getProductos, getPreciosByRuta]);

    // 💾 Guardar o actualizar precio de un producto en una ruta
    const guardarPrecio = useCallback(async (rutaId, productoId, data) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Verificar si ya existe el precio
            const { data: existing, error: checkError } = await supabase
                .from('precios_ruta')
                .select('id')
                .eq('ruta_id', rutaId)
                .eq('producto_id', productoId)
                .maybeSingle();

            if (checkError) throw checkError;

            const precioData = {
                ruta_id: rutaId,
                producto_id: productoId,
                precio_base: parseFloat(data.precio_base),
                precio_minimo: data.precio_minimo ? parseFloat(data.precio_minimo) : null,
                precio_costo: parseFloat(data.precio_costo),
                updated_at: new Date().toISOString(),
            };

            let result;
            if (existing) {
                // Actualizar
                const { data: updated, error } = await supabase
                    .from('precios_ruta')
                    .update(precioData)
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                result = updated;
            } else {
                // Insertar
                precioData.created_at = new Date().toISOString();
                const { data: inserted, error } = await supabase
                    .from('precios_ruta')
                    .insert([precioData])
                    .select()
                    .single();

                if (error) throw error;
                result = inserted;
            }

            setSuccess(true);
            return result;
        } catch (error) {
            console.error('Error al guardar precio:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 💾 Guardar múltiples precios (bulk update)
    const guardarPreciosMasivos = useCallback(async (rutaId, precios) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const results = [];
            const errores = [];

            for (const precio of precios) {
                const result = await guardarPrecio(rutaId, precio.producto_id, {
                    precio_base: precio.precio_base,
                    precio_minimo: precio.precio_minimo,
                    precio_costo: precio.precio_costo,
                });

                if (result) {
                    results.push(result);
                } else {
                    errores.push(`Error al guardar precio del producto ${precio.producto_id}`);
                }
            }

            if (errores.length > 0) {
                setError(`Se guardaron ${results.length} precios. Errores: ${errores.join(', ')}`);
            } else {
                setSuccess(true);
            }

            return results;
        } catch (error) {
            console.error('Error al guardar precios masivos:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [guardarPrecio]);

    // 🗑️ Eliminar precio de un producto en una ruta (volver al precio por defecto)
    const eliminarPrecio = useCallback(async (rutaId, productoId) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { error } = await supabase
                .from('precios_ruta')
                .delete()
                .eq('ruta_id', rutaId)
                .eq('producto_id', productoId);

            if (error) throw error;

            setSuccess(true);
            return true;
        } catch (error) {
            console.error('Error al eliminar precio:', error);
            setError(error.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // 📋 Obtener precios por defecto (de los productos)
    const getPreciosDefault = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('id, nombre, codigo, precio_base, precio_costo, precio_minimo')
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener precios por defecto:', error);
            return [];
        }
    }, []);

    return {
        loading,
        error,
        success,
        getRutas,
        getProductos,
        getPreciosByRuta,
        getProductosConPrecios,
        guardarPrecio,
        guardarPreciosMasivos,
        eliminarPrecio,
        getPreciosDefault,
        reset: () => {
            setError(null);
            setSuccess(false);
            setLoading(false);
        },
    };
}