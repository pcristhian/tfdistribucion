'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useEditProductos() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // 📦 Obtener un producto por ID
    const getProducto = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('productos')
                .select(`
                    *,
                    empresa: empresa_id (id, nombre, color_primario),
                    categoria: categoria_id (id, nombre)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener producto:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 📦 Obtener TODOS los productos (activos e inactivos)
    const getProductos = useCallback(async (soloActivos = true) => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('productos')
                .select(`
                    *,
                    empresa: empresa_id (id, nombre, color_primario),
                    categoria: categoria_id (id, nombre)
                `);

            if (soloActivos) {
                query = query.eq('activo', true);
            }

            const { data, error } = await query.order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener productos:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // ✏️ Actualizar un producto (SIN STOCK)
    const updateProducto = useCallback(async (id, data) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Validar campos requeridos
            if (!data.nombre) {
                throw new Error('El nombre es requerido');
            }
            if (!data.precio_base || data.precio_base <= 0) {
                throw new Error('El precio base es requerido y debe ser mayor a 0');
            }
            if (!data.precio_costo || data.precio_costo <= 0) {
                throw new Error('El precio de costo es requerido y debe ser mayor a 0');
            }
            if (!data.empresa_id) {
                throw new Error('La empresa es requerida');
            }
            if (!data.categoria_id) {
                throw new Error('La categoría es requerida');
            }

            const { data: result, error } = await supabase
                .from('productos')
                .update({
                    nombre: data.nombre,
                    codigo: data.codigo || null,
                    descripcion: data.descripcion || null,
                    precio_base: parseFloat(data.precio_base),
                    precio_minimo: data.precio_minimo ? parseFloat(data.precio_minimo) : null,
                    precio_costo: parseFloat(data.precio_costo),
                    corte: data.corte ? parseFloat(data.corte) : null,
                    empresa_id: data.empresa_id,
                    categoria_id: data.categoria_id,
                    activo: data.activo !== undefined ? data.activo : true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setSuccess(true);
            return result;
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 🆕 Crear un nuevo producto (SIN STOCK)
    const createProducto = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Validar campos requeridos
            if (!data.nombre) {
                throw new Error('El nombre es requerido');
            }
            if (!data.precio_base || data.precio_base <= 0) {
                throw new Error('El precio base es requerido y debe ser mayor a 0');
            }
            if (!data.precio_costo || data.precio_costo <= 0) {
                throw new Error('El precio de costo es requerido y debe ser mayor a 0');
            }
            if (!data.empresa_id) {
                throw new Error('La empresa es requerida');
            }
            if (!data.categoria_id) {
                throw new Error('La categoría es requerida');
            }

            const { data: result, error } = await supabase
                .from('productos')
                .insert([{
                    nombre: data.nombre,
                    codigo: data.codigo || null,
                    descripcion: data.descripcion || null,
                    precio_base: parseFloat(data.precio_base),
                    precio_minimo: data.precio_minimo ? parseFloat(data.precio_minimo) : null,
                    precio_costo: parseFloat(data.precio_costo),
                    corte: data.corte ? parseFloat(data.corte) : null,
                    empresa_id: data.empresa_id,
                    categoria_id: data.categoria_id,
                    activo: data.activo !== undefined ? data.activo : true,
                }])
                .select()
                .single();

            if (error) throw error;

            setSuccess(true);
            return result;
        } catch (error) {
            console.error('Error al crear producto:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 🗑️ Desactivar un producto
    const deleteProducto = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { error } = await supabase
                .from('productos')
                .update({
                    activo: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            setSuccess(true);
            return true;
        } catch (error) {
            console.error('Error al desactivar producto:', error);
            setError(error.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // 📊 Obtener empresas para el formulario
    const getEmpresas = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('empresas')
                .select('id, nombre, color_primario')
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener empresas:', error);
            setError(error.message);
            return [];
        }
    }, []);

    // 📊 Obtener categorías para el formulario
    const getCategorias = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('categorias_producto')
                .select('id, nombre')
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            setError(error.message);
            return [];
        }
    }, []);

    return {
        loading,
        error,
        success,
        getProducto,
        getProductos,
        createProducto,
        updateProducto,
        deleteProducto,
        getEmpresas,
        getCategorias,
        // Resetear estados
        reset: () => {
            setError(null);
            setSuccess(false);
            setLoading(false);
        },
    };
}