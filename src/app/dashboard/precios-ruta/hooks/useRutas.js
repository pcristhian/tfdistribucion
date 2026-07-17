// app/dashboard/rutas/hooks/useRutas.js
'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useRutas() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // 📊 Obtener todas las rutas
    const getRutas = useCallback(async (activo = null) => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('rutas')
                .select('*')
                .order('nombre', { ascending: true });

            if (activo !== null) {
                query = query.eq('activo', activo);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener rutas:', error);
            setError(error.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // 📊 Obtener una ruta por ID
    const getRutaById = useCallback(async (id) => {
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('rutas')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener ruta:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ Validar datos de la ruta
    // ✅ Validar datos de la ruta (CORREGIDO)
    const validarRuta = useCallback((data) => {
        const errores = [];

        if (!data.nombre || data.nombre.trim() === '') {
            errores.push('El nombre es requerido');
        }

        if (data.nombre && data.nombre.trim().length < 3) {
            errores.push('El nombre debe tener al menos 3 caracteres');
        }

        // Validar que no tenga caracteres especiales no permitidos
        if (data.nombre && /[<>{}]/.test(data.nombre)) {
            errores.push('El nombre contiene caracteres no permitidos');
        }

        return errores;
    }, []);

    const crearRuta = useCallback(async (data) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Validar que el nombre esté presente
            if (!data.nombre || data.nombre.trim() === '') {
                throw new Error('El nombre es requerido');
            }

            if (data.nombre.trim().length < 3) {
                throw new Error('El nombre debe tener al menos 3 caracteres');
            }

            // ✅ Preparar datos SOLO con campos que tienen valor
            const rutaData = {};

            // Campo obligatorio
            rutaData.nombre = data.nombre.trim();

            // ✅ Campos opcionales: solo incluir si tienen valor
            if (data.descripcion && data.descripcion.trim() !== '') {
                rutaData.descripcion = data.descripcion.trim();
            }

            if (data.ciudad && data.ciudad.trim() !== '') {
                rutaData.ciudad = data.ciudad.trim();
            }

            if (data.zona && data.zona.trim() !== '') {
                rutaData.zona = data.zona.trim();
            }

            // ✅ Activo por defecto
            rutaData.activo = data.activo !== undefined ? data.activo : true;

            console.log('📝 Datos a insertar (limpiados):', rutaData);

            // Verificar si ya existe una ruta con el mismo nombre
            const { data: existing, error: checkError } = await supabase
                .from('rutas')
                .select('id, nombre')
                .ilike('nombre', rutaData.nombre)
                .maybeSingle();

            if (checkError) {
                console.error('❌ Error al verificar existencia:', checkError);
                throw new Error(`Error al verificar existencia: ${checkError.message}`);
            }

            if (existing) {
                throw new Error(`Ya existe una ruta con el nombre "${rutaData.nombre}"`);
            }

            // Insertar ruta
            const { data: result, error } = await supabase
                .from('rutas')
                .insert([rutaData])
                .select()
                .single();

            if (error) {
                console.error('❌ Error de Supabase al insertar:', error);
                console.error('❌ Código:', error.code);
                console.error('❌ Mensaje:', error.message);
                console.error('❌ Detalles:', error.details);
                console.error('❌ Hint:', error.hint);

                let mensajeError = 'Error al crear la ruta: ';
                if (error.code === '23505') {
                    mensajeError += 'Ya existe una ruta con ese nombre.';
                } else if (error.code === '23514') {
                    mensajeError += 'Violación de restricción de la base de datos.';
                } else if (error.message) {
                    mensajeError += error.message;
                } else {
                    mensajeError += 'Error desconocido.';
                }
                throw new Error(mensajeError);
            }

            console.log('✅ Ruta creada:', result);
            setSuccess(true);
            return result;
        } catch (error) {
            console.error('❌ Error al crear ruta:', error);
            setError(error.message || 'Error desconocido al crear la ruta');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const actualizarRuta = useCallback(async (id, data) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Validar que el nombre esté presente
            if (!data.nombre || data.nombre.trim() === '') {
                throw new Error('El nombre es requerido');
            }

            if (data.nombre.trim().length < 3) {
                throw new Error('El nombre debe tener al menos 3 caracteres');
            }

            // ✅ Preparar datos SOLO con campos que tienen valor
            const rutaData = {};

            // Campo obligatorio
            rutaData.nombre = data.nombre.trim();

            // ✅ Campos opcionales: solo incluir si tienen valor
            if (data.descripcion && data.descripcion.trim() !== '') {
                rutaData.descripcion = data.descripcion.trim();
            }

            if (data.ciudad && data.ciudad.trim() !== '') {
                rutaData.ciudad = data.ciudad.trim();
            }

            if (data.zona && data.zona.trim() !== '') {
                rutaData.zona = data.zona.trim();
            }

            // ✅ Activo
            rutaData.activo = data.activo !== undefined ? data.activo : true;

            console.log('📝 Datos a actualizar (limpiados):', rutaData);

            // Verificar si ya existe otra ruta con el mismo nombre
            const { data: existing, error: checkError } = await supabase
                .from('rutas')
                .select('id')
                .ilike('nombre', rutaData.nombre)
                .neq('id', id)
                .maybeSingle();

            if (checkError) {
                console.error('❌ Error al verificar existencia:', checkError);
                throw new Error(`Error al verificar existencia: ${checkError.message}`);
            }

            if (existing) {
                throw new Error(`Ya existe otra ruta con el nombre "${rutaData.nombre}"`);
            }

            // Actualizar ruta
            const { data: result, error } = await supabase
                .from('rutas')
                .update(rutaData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('❌ Error de Supabase al actualizar:', error);
                console.error('❌ Código:', error.code);
                console.error('❌ Mensaje:', error.message);
                console.error('❌ Detalles:', error.details);
                console.error('❌ Hint:', error.hint);

                let mensajeError = 'Error al actualizar la ruta: ';
                if (error.code === '23505') {
                    mensajeError += 'Ya existe otra ruta con ese nombre.';
                } else if (error.message) {
                    mensajeError += error.message;
                } else {
                    mensajeError += 'Error desconocido.';
                }
                throw new Error(mensajeError);
            }

            console.log('✅ Ruta actualizada:', result);
            setSuccess(true);
            return result;
        } catch (error) {
            console.error('❌ Error al actualizar ruta:', error);
            setError(error.message || 'Error desconocido al actualizar la ruta');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 🗑️ Eliminar una ruta (desactivar lógicamente)
    const eliminarRuta = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Verificar si la ruta tiene clientes asociados
            const { data: clientes, error: clientesError, count } = await supabase
                .from('clientes')
                .select('id', { count: 'exact', head: true })
                .eq('ruta_id', id);

            if (clientesError) {
                console.error('❌ Error al verificar clientes:', clientesError);
                throw new Error(clientesError.message);
            }

            if (count && count > 0) {
                // Si tiene clientes, solo desactivar
                const { data, error } = await supabase
                    .from('rutas')
                    .update({ activo: false })
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;

                setSuccess(true);
                return { ...data, desactivado: true, clientes_asociados: count };
            } else {
                // Si no tiene clientes, eliminar físicamente
                const { error } = await supabase
                    .from('rutas')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setSuccess(true);
                return { eliminado: true };
            }
        } catch (error) {
            console.error('❌ Error al eliminar ruta:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 🔄 Activar/Desactivar una ruta (CORREGIDO)
    const toggleActivo = useCallback(async (id, activo) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { data, error } = await supabase
                .from('rutas')
                .update({
                    activo: activo
                    // ⚠️ NO incluir updated_at
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('❌ Error al cambiar estado:', error);
                throw new Error(error.message);
            }

            console.log('✅ Estado actualizado:', data);
            setSuccess(true);
            return data;
        } catch (error) {
            console.error('❌ Error al cambiar estado de ruta:', error);
            setError(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // 🗑️ Eliminar ruta físicamente (solo si no tiene clientes)
    const eliminarRutaFisicamente = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Verificar si la ruta tiene clientes asociados
            const { data: clientes, error: clientesError } = await supabase
                .from('clientes')
                .select('id', { count: 'exact', head: true })
                .eq('ruta_id', id);

            if (clientesError) throw clientesError;

            if (clientes && clientes.length > 0) {
                throw new Error(`No se puede eliminar la ruta porque tiene ${clientes.length} cliente(s) asociado(s)`);
            }

            // Eliminar físicamente
            const { error } = await supabase
                .from('rutas')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSuccess(true);
            return true;
        } catch (error) {
            console.error('Error al eliminar ruta:', error);
            setError(error.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // 📊 Obtener estadísticas de una ruta
    const getEstadisticasRuta = useCallback(async (id) => {
        try {
            // Obtener cantidad de clientes
            const { data: clientes, error: clientesError } = await supabase
                .from('clientes')
                .select('id', { count: 'exact', head: true })
                .eq('ruta_id', id)
                .eq('activo', true);

            if (clientesError) throw clientesError;

            // Obtener cantidad de precios personalizados
            const { data: precios, error: preciosError } = await supabase
                .from('precios_ruta')
                .select('id', { count: 'exact', head: true })
                .eq('ruta_id', id);

            if (preciosError) throw preciosError;

            return {
                clientes_activos: clientes?.length || 0,
                precios_personalizados: precios?.length || 0,
            };
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return {
                clientes_activos: 0,
                precios_personalizados: 0,
            };
        }
    }, []);

    // 🗑️ Resetear estados
    const reset = useCallback(() => {
        setError(null);
        setSuccess(false);
        setLoading(false);
    }, []);

    return {
        loading,
        error,
        success,
        getRutas,
        getRutaById,
        crearRuta,
        actualizarRuta,
        eliminarRuta,
        eliminarRutaFisicamente,
        toggleActivo,
        getEstadisticasRuta,
        validarRuta,
        reset,
    };
}