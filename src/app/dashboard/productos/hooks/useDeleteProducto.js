// src/app/dashboard/productos/hooks/useDeleteProducto.js
'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useDeleteProducto() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [productoDesactivado, setProductoDesactivado] = useState(null);

    // 🗑️ Desactivar un producto (soft delete)
    const desactivarProducto = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        setProductoDesactivado(null);

        try {
            if (!id) {
                throw new Error('El ID del producto es requerido');
            }

            const { data: producto, error: checkError } = await supabase
                .from('productos')
                .select('id, nombre, codigo, activo')
                .eq('id', id)
                .single();

            if (checkError) throw checkError;

            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            if (!producto.activo) {
                throw new Error(`El producto "${producto.nombre}" ya está desactivado`);
            }

            const { data: result, error } = await supabase
                .from('productos')
                .update({
                    activo: false,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select(`
                    *,
                    empresa: empresa_id (id, nombre, color_primario),
                    categoria: categoria_id (id, nombre)
                `)
                .single();

            if (error) throw error;

            setSuccess(true);
            setProductoDesactivado(result);
            return result;
        } catch (error) {
            console.error('Error al desactivar producto:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔄 Activar un producto
    const activarProducto = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        setProductoDesactivado(null);

        try {
            if (!id) {
                throw new Error('El ID del producto es requerido');
            }

            const { data: producto, error: checkError } = await supabase
                .from('productos')
                .select('id, nombre, codigo, activo')
                .eq('id', id)
                .single();

            if (checkError) throw checkError;

            if (!producto) {
                throw new Error('Producto no encontrado');
            }

            if (producto.activo) {
                throw new Error(`El producto "${producto.nombre}" ya está activo`);
            }

            const { data: result, error } = await supabase
                .from('productos')
                .update({
                    activo: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select(`
                    *,
                    empresa: empresa_id (id, nombre, color_primario),
                    categoria: categoria_id (id, nombre)
                `)
                .single();

            if (error) throw error;

            setSuccess(true);
            setProductoDesactivado(result);
            return result;
        } catch (error) {
            console.error('Error al activar producto:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 📋 Obtener productos inactivos
    const getProductosInactivos = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select(`
                    *,
                    empresa: empresa_id (id, nombre, color_primario),
                    categoria: categoria_id (id, nombre)
                `)
                .eq('activo', false)
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener productos inactivos:', error);
            setError(error.message);
            return [];
        }
    }, []);

    // 📋 Obtener productos activos
    const getProductosActivos = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select(`
                    *,
                    empresa: empresa_id (id, nombre, color_primario),
                    categoria: categoria_id (id, nombre)
                `)
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener productos activos:', error);
            setError(error.message);
            return [];
        }
    }, []);

    // 🗑️ Resetear estados
    const reset = useCallback(() => {
        setError(null);
        setSuccess(false);
        setLoading(false);
        setProductoDesactivado(null);
    }, []);

    return {
        loading,
        error,
        success,
        productoDesactivado,
        desactivarProducto,
        activarProducto,
        getProductosInactivos,
        getProductosActivos,
        reset,
    };
}