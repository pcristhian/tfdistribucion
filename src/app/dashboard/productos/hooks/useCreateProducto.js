// hooks/useCreateProducto.js
'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useCreateProducto() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [productoCreado, setProductoCreado] = useState(null);

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

    // ✅ Validar datos del producto
    const validarProducto = useCallback((data) => {
        const errores = [];

        if (!data.nombre || data.nombre.trim() === '') {
            errores.push('El nombre es requerido');
        }

        if (!data.empresa_id) {
            errores.push('La empresa es requerida');
        }

        if (!data.categoria_id) {
            errores.push('La categoría es requerida');
        }

        if (!data.precio_base || data.precio_base <= 0) {
            errores.push('El precio base debe ser mayor a 0');
        }

        if (!data.precio_costo || data.precio_costo <= 0) {
            errores.push('El precio de costo debe ser mayor a 0');
        }

        if (data.precio_minimo && data.precio_minimo > data.precio_base) {
            errores.push('El precio mínimo no puede ser mayor al precio base');
        }

        if (data.corte && data.corte < 0) {
            errores.push('El corte no puede ser negativo');
        }

        return errores;
    }, []);

    // 🆕 Crear un nuevo producto
    const createProducto = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        setProductoCreado(null);

        try {
            // Validar datos
            const errores = validarProducto(data);
            if (errores.length > 0) {
                throw new Error(errores.join(', '));
            }

            // Preparar datos para inserción
            const productoData = {
                nombre: data.nombre.trim(),
                codigo: data.codigo ? data.codigo.trim().toUpperCase() : null,
                descripcion: data.descripcion ? data.descripcion.trim() : null,
                precio_base: parseFloat(data.precio_base),
                precio_minimo: data.precio_minimo ? parseFloat(data.precio_minimo) : null,
                precio_costo: parseFloat(data.precio_costo),
                corte: data.corte ? parseFloat(data.corte) : null,
                empresa_id: data.empresa_id,
                categoria_id: data.categoria_id,
                activo: data.activo !== undefined ? data.activo : true,
            };

            // Verificar si el código ya existe (si se proporcionó)
            if (productoData.codigo) {
                const { data: existing, error: checkError } = await supabase
                    .from('productos')
                    .select('id')
                    .eq('codigo', productoData.codigo)
                    .maybeSingle();

                if (checkError) throw checkError;
                if (existing) {
                    throw new Error(`El código "${productoData.codigo}" ya está en uso`);
                }
            }

            // Insertar producto
            const { data: result, error } = await supabase
                .from('productos')
                .insert([productoData])
                .select(`
                    *,
                    empresa: empresa_id (id, nombre, color_primario),
                    categoria: categoria_id (id, nombre)
                `)
                .single();

            if (error) throw error;

            setSuccess(true);
            setProductoCreado(result);
            return result;
        } catch (error) {
            console.error('Error al crear producto:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, [validarProducto]);

    // 🔄 Verificar si un código está disponible
    const verificarCodigo = useCallback(async (codigo) => {
        if (!codigo || codigo.trim() === '') {
            return { disponible: true };
        }

        try {
            const { data, error } = await supabase
                .from('productos')
                .select('id, nombre')
                .eq('codigo', codigo.trim().toUpperCase())
                .maybeSingle();

            if (error) throw error;

            return {
                disponible: !data,
                producto_existente: data || null,
            };
        } catch (error) {
            console.error('Error al verificar código:', error);
            return { disponible: false, error: error.message };
        }
    }, []);

    // 📋 Obtener datos para el formulario (empresas + categorías)
    const getFormData = useCallback(async () => {
        try {
            const [empresas, categorias] = await Promise.all([
                getEmpresas(),
                getCategorias(),
            ]);

            return { empresas, categorias };
        } catch (error) {
            console.error('Error al obtener datos del formulario:', error);
            setError(error.message);
            return { empresas: [], categorias: [] };
        }
    }, [getEmpresas, getCategorias]);

    // 🗑️ Resetear estados
    const reset = useCallback(() => {
        setError(null);
        setSuccess(false);
        setLoading(false);
        setProductoCreado(null);
    }, []);

    return {
        loading,
        error,
        success,
        productoCreado,
        createProducto,
        getEmpresas,
        getCategorias,
        getFormData,
        verificarCodigo,
        validarProducto,
        reset,
    };
}