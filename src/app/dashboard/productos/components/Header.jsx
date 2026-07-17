'use client';

import { useRouter } from 'next/navigation';
import { useLogin } from '../../../login/hook/useLogin';

export default function Header({ titulo = 'Productos' }) {
    const router = useRouter();
    const { getUser } = useLogin();
    const user = getUser();

    // Formatear fecha: "lun / 07"
    const formatearFecha = () => {
        const fecha = new Date();
        const diasSemana = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
        const diaSemana = diasSemana[fecha.getDay()];
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${diaSemana} / ${dia}`;
    };

    // Obtener iniciales del nombre
    const getInitials = (nombre) => {
        if (!nombre) return 'U';
        const partes = nombre.split(' ');
        if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
        return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-2 py-1.5 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
                {/* Izquierda: Botón Home + Título */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800 flex-shrink-0"
                        aria-label="Volver al dashboard"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </button>
                    <h1 className="text-sm font-bold text-gray-800 truncate">{titulo}</h1>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Gestión
                    </span>
                </div>

                {/* Centro - Búsqueda rápida (opcional) */}
                <div className="hidden md:flex flex-1 max-w-xs mx-2">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs"
                        />
                        <span className="absolute right-2.5 top-1 text-gray-400 text-[11px]">🔍</span>
                    </div>
                </div>

                {/* Derecha: Fecha y Usuario */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-gray-500 font-medium">
                        {formatearFecha()}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {/* Avatar con iniciales */}
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-sm flex-shrink-0">
                            {getInitials(user?.nombre)}
                        </div>
                        {/* Nombre completo */}
                        <div className="flex flex-col items-start">
                            <span className="text-[11px] font-semibold text-gray-800 leading-tight truncate max-w-[60px]">
                                {user?.nombre || 'Usuario'}
                            </span>
                            {user?.rol && (
                                <span className="text-[9px] text-gray-400 capitalize leading-tight">
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