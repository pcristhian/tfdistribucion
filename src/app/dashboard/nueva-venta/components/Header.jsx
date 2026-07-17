'use client';

import { useRouter } from 'next/navigation';
import { useLogin } from '../../../login/hook/useLogin';
import { useVentas } from '../hooks/useVentas';
import { useEffect, useState } from 'react';

export default function Header({ titulo = 'Nueva Venta' }) {
    const router = useRouter();
    const { getUser } = useLogin();
    const user = getUser();
    const { getDiaActivo } = useVentas();
    const [fechaActiva, setFechaActiva] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (user?.id) {
            const cargarDia = async () => {
                setCargando(true);
                try {
                    const dia = await getDiaActivo(user.id);
                    if (dia) {
                        setFechaActiva(dia.fecha);
                    } else {
                        setFechaActiva(null);
                    }
                } catch (error) {
                    console.error('Error al cargar día activo:', error);
                    setFechaActiva(null);
                } finally {
                    setCargando(false);
                }
            };
            cargarDia();
        } else {
            setCargando(false);
        }
    }, [user?.id, getDiaActivo]);

    // Formatear fecha: "lun / 07"
    const formatearFecha = () => {
        const fecha = new Date();
        const diasSemana = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
        const diaSemana = diasSemana[fecha.getDay()];
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${diaSemana} / ${dia}`;
    };

    // Formatear fecha del día activo
    const formatearFechaActiva = (fecha) => {
        if (!fecha) return null;
        const fechaObj = new Date(fecha);
        const diasSemana = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const diaSemana = diasSemana[fechaObj.getDay()];
        const dia = String(fechaObj.getDate()).padStart(2, '0');
        const mes = meses[fechaObj.getMonth()];
        return `${diaSemana} ${dia} ${mes}`;
    };

    // Obtener iniciales del nombre
    const getInitials = (nombre) => {
        if (!nombre) return 'U';
        const partes = nombre.split(' ');
        if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
        return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
    };

    const fechaActivaFormateada = fechaActiva ? formatearFechaActiva(fechaActiva) : null;

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Izquierda: Botón Home + Título */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                        aria-label="Volver al dashboard"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-bold text-gray-800">{titulo}</h1>
                    {/* Badge con fecha del día activo */}
                    {!cargando && fechaActivaFormateada && (
                        <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            {fechaActivaFormateada}
                        </span>
                    )}
                    {!cargando && !fechaActivaFormateada && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full">
                            Sin día activo
                        </span>
                    )}
                    {cargando && (
                        <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            Cargando...
                        </span>
                    )}
                </div>

                {/* Derecha: Fecha y Usuario */}
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 font-medium">
                        {formatearFecha()}
                    </span>
                    <div className="flex items-center gap-3">
                        {/* Avatar con iniciales */}
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {getInitials(user?.nombre)}
                        </div>
                        {/* Nombre completo */}
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-semibold text-gray-800 leading-tight">
                                {user?.nombre || 'Usuario'}
                            </span>
                            {user?.rol && (
                                <span className="text-xs text-gray-400 capitalize leading-tight">
                                    {user.rol}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}