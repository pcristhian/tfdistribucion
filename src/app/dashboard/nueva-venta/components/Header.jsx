// app/dashboard/nueva-venta/components/Header.jsx
'use client';

import { useRouter } from 'next/navigation';
import { useLogin } from '../../../login/hook/useLogin';
import { useVentasLectura } from '../hooks/useVentasLectura';
import { useEffect, useState } from 'react';

export default function Header({ titulo = 'Nueva Venta' }) {
    const router = useRouter();
    const { getUser } = useLogin();
    const user = getUser();
    const { getDiaActivo } = useVentasLectura();
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

    // Formatear fecha: "lun 07"
    const formatearFecha = () => {
        const fecha = new Date();
        const diasSemana = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
        const diaSemana = diasSemana[fecha.getDay()];
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${diaSemana} ${dia}`;
    };

    // Formatear fecha del día activo (corta)
    const formatearFechaActiva = (fecha) => {
        if (!fecha) return null;
        const fechaObj = new Date(fecha);
        const diasSemana = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
        const diaSemana = diasSemana[fechaObj.getDay()];
        const dia = String(fechaObj.getDate()).padStart(2, '0');
        return `${diaSemana} ${dia}`;
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
        <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 px-2 py-1.5 shadow-lg">
            <div className="flex items-center justify-between gap-1.5">
                {/* Izquierda: Botón Home + Título */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 text-white/90 hover:text-white flex-shrink-0"
                        aria-label="Volver al dashboard"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </button>

                    <h1 className="text-sm font-bold text-white truncate">
                        {titulo}
                    </h1>

                    {/* Badge con fecha del día activo - más compacto */}
                    {!cargando && fechaActivaFormateada && (
                        <span className="text-[9px] bg-green-500/30 text-green-100 px-1.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 backdrop-blur-sm border border-green-400/20">
                            <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                            {fechaActivaFormateada}
                        </span>
                    )}
                    {!cargando && !fechaActivaFormateada && (
                        <span className="text-[9px] bg-yellow-500/30 text-yellow-100 px-1.5 py-0.5 rounded-full flex-shrink-0 backdrop-blur-sm border border-yellow-400/20">
                            ⚠️ Sin día
                        </span>
                    )}
                    {cargando && (
                        <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                            <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-transparent rounded-full animate-spin"></div>
                        </span>
                    )}
                </div>

                {/* Derecha: Fecha + Usuario */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] text-white/80 font-medium hidden xs:block">
                        {formatearFecha()}
                    </span>

                    <div className="w-px h-5 bg-white/20 hidden xs:block"></div>

                    <div className="flex items-center gap-1.5">
                        {/* Avatar más compacto */}
                        <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-[10px] ring-2 ring-white/30 shadow-lg flex-shrink-0 hover:scale-105 transition-transform duration-200">
                            {getInitials(user?.nombre)}
                        </div>

                        {/* Nombre - oculto en móviles muy pequeños */}
                        <div className="hidden sm:flex flex-col items-start">
                            <span className="text-[10px] font-semibold text-white leading-tight truncate max-w-[50px]">
                                {user?.nombre?.split(' ')[0] || 'Usuario'}
                            </span>
                            {user?.rol && (
                                <span className="text-[8px] text-white/60 capitalize leading-tight">
                                    {user.rol}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Indicador de estado del día - solo visible en mobile */}
            {!cargando && fechaActivaFormateada && (
                <div className="md:hidden mt-1 flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-green-200/80 font-medium">
                        Día activo: {fechaActivaFormateada}
                    </span>
                </div>
            )}
            {!cargando && !fechaActivaFormateada && (
                <div className="md:hidden mt-1 flex items-center justify-center gap-1.5">
                    <span className="text-[9px] text-yellow-200/80 font-medium">
                        ⚠️ No hay día activo
                    </span>
                </div>
            )}
        </header>
    );
}