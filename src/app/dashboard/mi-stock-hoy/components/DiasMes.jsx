'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function DiasMes({
    distribuidorId,
    onSelectDia,
    diaSeleccionado = null
}) {
    const [diasDelMes, setDiasDelMes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [diasConDatos, setDiasConDatos] = useState([]);
    const [mesActual, setMesActual] = useState('');
    const [anoActual, setAnoActual] = useState('');
    const [fechaHoy, setFechaHoy] = useState('');

    // Obtener días del mes actual
    useEffect(() => {
        const fecha = new Date();
        const year = fecha.getFullYear();
        const month = fecha.getMonth();
        const hoy = fecha.getDate();

        // Guardar fecha de hoy en formato YYYY-MM-DD
        const hoyStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(hoy).padStart(2, '0')}`;
        setFechaHoy(hoyStr);

        setMesActual(fecha.toLocaleString('es-BO', { month: 'long' }));
        setAnoActual(year.toString());

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

    // Verificar qué días tienen datos de stock
    useEffect(() => {
        if (!distribuidorId || diasDelMes.length === 0) return;

        const verificarDiasConDatos = async () => {
            setLoading(true);
            try {
                const fechas = diasDelMes.map(d => d.fecha);

                const { data, error } = await supabase
                    .from('stock_diario')
                    .select('fecha')
                    .eq('distribuidor_id', distribuidorId)
                    .in('fecha', fechas)
                    .order('fecha', { ascending: false });

                if (error) throw error;

                const fechasConDatos = data.map(item => item.fecha);
                setDiasConDatos(fechasConDatos);
            } catch (error) {
                console.error('Error al verificar días con datos:', error);
            } finally {
                setLoading(false);
            }
        };

        verificarDiasConDatos();
    }, [distribuidorId, diasDelMes]);

    const handleSelectDia = (fecha) => {
        const tieneDatos = diasConDatos.includes(fecha);
        onSelectDia(fecha, tieneDatos);
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
                </span>
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                {diasDelMes.map((dia) => {
                    const tieneStock = tieneDatos(dia.fecha);
                    const seleccionado = isSelected(dia.fecha);
                    const hoy = isToday(dia.fecha);

                    return (
                        <motion.button
                            key={dia.numero}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelectDia(dia.fecha)}
                            className={`
                                relative flex flex-col items-center justify-center p-2 rounded-xl 
                                transition-all duration-200 min-h-[52px] text-center
                                ${seleccionado
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105'
                                    : tieneStock
                                        ? 'bg-green-50 hover:bg-green-100 border border-green-200'
                                        : hoy
                                            ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                                }
                            `}
                        >
                            <span className={`text-sm font-medium ${seleccionado ? 'text-white' : 'text-gray-700'}`}>
                                {dia.numero}
                            </span>
                            <span className={`text-[9px] ${seleccionado ? 'text-blue-100' : 'text-gray-400'}`}>
                                {dia.diaSemana}
                            </span>

                            {/* Badge de hoy */}
                            {hoy && !seleccionado && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full text-[8px] text-white font-bold">
                                    H
                                </span>
                            )}

                            {/* Badge de datos */}
                            {tieneStock && !seleccionado && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-green-500 rounded-full text-[8px] text-white font-bold">
                                    ✓
                                </span>
                            )}

                            {/* Badge de seleccionado */}
                            {seleccionado && (
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
                    {diasConDatos.includes(diaSeleccionado) ? (
                        <span className="ml-2 text-green-600">✅ Con stock registrado</span>
                    ) : (
                        <span className="ml-2 text-yellow-600">⚠️ Sin stock registrado</span>
                    )}
                </div>
            )}
        </div>
    );
}