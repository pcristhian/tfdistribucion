// app/dashboard/precios-ruta/components/Header.js
'use client';

import { useRouter } from 'next/navigation';
import { useLogin } from '../../../login/hook/useLogin';

export default function Header({
    titulo = 'Precios por Ruta',
    onNuevaRuta // ✅ Callback para abrir modal de nueva ruta
}) {
    const router = useRouter();
    const { getUser } = useLogin();
    const user = getUser();

    const formatearFecha = () => {
        const fecha = new Date();
        const diasSemana = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
        const diaSemana = diasSemana[fecha.getDay()];
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${diaSemana} / ${dia}`;
    };

    const getInitials = (nombre) => {
        if (!nombre) return 'U';
        const partes = nombre.split(' ');
        if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
        return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 shadow-lg">
            <div className="flex items-center justify-between gap-2">
                {/* Izquierda: Home + Título */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 text-white/90 hover:text-white flex-shrink-0"
                        aria-label="Volver al dashboard"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-1.5 min-w-0">
                        <h1 className="text-base font-bold text-white truncate">
                            {titulo}
                        </h1>
                        <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full flex-shrink-0 backdrop-blur-sm">
                            💰
                        </span>
                    </div>
                </div>

                {/* Centro: Botón Nueva Ruta (visible en desktop) */}
                <button
                    onClick={onNuevaRuta}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white/90 hover:text-white text-sm font-medium border border-white/20"
                >
                    <span className="text-base">🗺️</span>
                    Nueva Ruta
                </button>

                {/* Derecha: Fecha + Usuario */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-white/80 font-medium hidden sm:block">
                        {formatearFecha()}
                    </span>

                    <div className="w-px h-6 bg-white/20 hidden sm:block"></div>

                    <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-[11px] ring-2 ring-white/30 shadow-lg flex-shrink-0 hover:scale-105 transition-transform duration-200">
                            {getInitials(user?.nombre)}
                        </div>
                        <div className="hidden sm:flex flex-col items-start">
                            <span className="text-[11px] font-semibold text-white leading-tight truncate max-w-[60px]">
                                {user?.nombre?.split(' ')[0] || 'Usuario'}
                            </span>
                            {user?.rol && (
                                <span className="text-[9px] text-white/60 capitalize leading-tight">
                                    {user.rol}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Botón Nueva Ruta (mobile) */}
            <div className="md:hidden mt-1.5 flex justify-center">
                <button
                    onClick={onNuevaRuta}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white/90 hover:text-white text-xs font-medium border border-white/20 w-full justify-center"
                >
                    <span className="text-base">🗺️</span>
                    Nueva Ruta
                </button>
            </div>
        </header>
    );
}