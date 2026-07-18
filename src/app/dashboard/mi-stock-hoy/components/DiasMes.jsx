'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function DiasMes({
    distribuidorId,
    onSelectDia,
    diaSeleccionado = null,
    onDiaActivo
}) {
    const [diasDelMes, setDiasDelMes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [diasConDatos, setDiasConDatos] = useState([]);
    const [diaActivo, setDiaActivo] = useState(null);
    const [mesActual, setMesActual] = useState('');
    const [anoActual, setAnoActual] = useState('');
    const [fechaHoy, setFechaHoy] = useState('');

    // ✅ Obtener días del mes actual - USANDO LA MISMA LÓGICA QUE EL HEADER
    useEffect(() => {
        // Usar la fecha actual del navegador (igual que el header)
        const ahora = new Date();
        const year = ahora.getFullYear();
        const month = ahora.getMonth();
        const hoy = ahora.getDate();

        // Formatear fecha como YYYY-MM-DD (igual que en la BD)
        const hoyStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(hoy).padStart(2, '0')}`;
        setFechaHoy(hoyStr);

        // Formatear mes y año en español
        setMesActual(ahora.toLocaleString('es-BO', { month: 'long' }));
        setAnoActual(year.toString());

        // Obtener todos los días del mes
        const totalDias = new Date(year, month + 1, 0).getDate();

        const dias = [];
        for (let i = 1; i <= totalDias; i++) {
            const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const diaSemana = new Date(year, month, i).toLocaleString('es-BO', { weekday: 'short' });
            dias.push({
                numero: i,
                fecha: fechaStr,
                diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
                esHoy: fechaStr === hoyStr,
            });
        }
        setDiasDelMes(dias);
    }, []);

    // ✅ Verificar qué días tienen datos y cuál está activo
    useEffect(() => {
        if (!distribuidorId || diasDelMes.length === 0) return;

        const verificarDiasConDatos = async () => {
            setLoading(true);
            try {
                const fechas = diasDelMes.map(d => d.fecha);

                const { data, error } = await supabase
                    .from('stock_diario')
                    .select('fecha, estado, datos')
                    .eq('distribuidor_id', distribuidorId)
                    .in('fecha', fechas)
                    .order('fecha', { ascending: false });

                if (error) throw error;

                // ✅ Filtrar fechas que tienen datos (productos no vacío)
                const fechasConDatos = data
                    .filter(item => {
                        const productos = item.datos?.productos || [];
                        return productos.length > 0;
                    })
                    .map(item => item.fecha);

                setDiasConDatos(fechasConDatos);

                // ✅ Encontrar el día activo
                const activo = data.find(item => item.estado === 'activo');
                if (activo) {
                    setDiaActivo(activo.fecha);
                    if (onDiaActivo) {
                        onDiaActivo(activo.fecha);
                    }
                } else {
                    setDiaActivo(null);
                    if (onDiaActivo) {
                        onDiaActivo(null);
                    }
                }
            } catch (error) {
                console.error('Error al verificar días con datos:', error);
            } finally {
                setLoading(false);
            }
        };

        verificarDiasConDatos();
    }, [distribuidorId, diasDelMes, onDiaActivo]);

    const handleSelectDia = (fecha) => {
        const tieneDatos = diasConDatos.includes(fecha);
        const esActivo = diaActivo === fecha;
        onSelectDia(fecha, tieneDatos, esActivo);
    };

    // Verificar si un día tiene datos
    const tieneDatos = useCallback((fecha) => {
        return diasConDatos.includes(fecha);
    }, [diasConDatos]);

    // Verificar si es el día seleccionado
    const isSelected = useCallback((fecha) => {
        return diaSeleccionado === fecha;
    }, [diaSeleccionado]);

    // Verificar si es hoy
    const isToday = useCallback((fecha) => {
        return fecha === fechaHoy;
    }, [fechaHoy]);

    // Verificar si es el día activo
    const isActivo = useCallback((fecha) => {
        return diaActivo === fecha;
    }, [diaActivo]);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            {/* Header del calendario */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <h3 className="text-sm font-semibold text-gray-700">
                        {mesActual.charAt(0).toUpperCase() + mesActual.slice(1)} {anoActual}
                    </h3>
                </div>
                <span className="text-xs text-gray-400">
                    {diasConDatos.length} días con datos
                    {diaActivo && (
                        <span className="ml-2 text-green-600">● Activo: {new Date(diaActivo).getDate()}</span>
                    )}
                </span>
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                {diasDelMes.map((dia) => {
                    const tieneStock = tieneDatos(dia.fecha);
                    const seleccionado = isSelected(dia.fecha);
                    const hoy = isToday(dia.fecha);
                    const activo = isActivo(dia.fecha);

                    return (
                        <motion.button
                            key={dia.numero}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelectDia(dia.fecha)}
                            className={`
                                relative flex flex-col items-center justify-center p-2 rounded-xl 
                                transition-all duration-200 min-h-[52px] text-center
                                ${activo
                                    ? 'bg-green-600 text-white shadow-lg shadow-green-100 scale-105 border-2 border-green-400'
                                    : seleccionado
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105'
                                        : tieneStock
                                            ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                                            : hoy
                                                ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                                }
                            `}
                        >
                            <span className={`text-sm font-medium ${(activo || seleccionado) ? 'text-white' : 'text-gray-700'}`}>
                                {dia.numero}
                            </span>
                            <span className={`text-[9px] ${(activo || seleccionado) ? 'text-green-100' : 'text-gray-400'}`}>
                                {dia.diaSemana}
                            </span>

                            {/* Badge de hoy */}
                            {hoy && !seleccionado && !activo && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full text-[8px] text-white font-bold">
                                    H
                                </span>
                            )}

                            {/* Badge de activo */}
                            {activo && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-white rounded-full text-[10px] text-green-600 font-bold shadow-sm">
                                    🔓
                                </span>
                            )}

                            {/* Badge de datos */}
                            {tieneStock && !activo && !seleccionado && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-green-500 rounded-full text-[8px] text-white font-bold">
                                    ✓
                                </span>
                            )}

                            {/* Badge de seleccionado */}
                            {seleccionado && !activo && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-white rounded-full text-[8px] text-blue-600 font-bold">
                                    ✓
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                    <span className="text-gray-500">Activo</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-gray-500">Con datos</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-gray-200 rounded-full"></span>
                    <span className="text-gray-500">Sin datos</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                    <span className="text-gray-500">Seleccionado</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-500">Hoy</span>
                </div>
            </div>

            {/* Resumen del día seleccionado */}
            {diaSeleccionado && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 text-center">
                    Día seleccionado: <strong className="text-gray-700">
                        {new Date(diaSeleccionado).toLocaleDateString('es-BO', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                        })}
                    </strong>
                    {diaActivo === diaSeleccionado ? (
                        <span className="ml-2 text-green-600">🔓 Activo</span>
                    ) : diasConDatos.includes(diaSeleccionado) ? (
                        <span className="ml-2 text-blue-600">📊 Con stock registrado</span>
                    ) : (
                        <span className="ml-2 text-yellow-600">⚠️ Sin stock registrado</span>
                    )}
                </div>
            )}
        </div>
    );
}