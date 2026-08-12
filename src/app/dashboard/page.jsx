'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function DashboardPage() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        setIsMounted(true);

        // Obtener usuario de localStorage (simulación)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setIsLoading(false);
            } catch (error) {
                console.error('Error al leer usuario:', error);
                router.push('/');
            }
        } else {
            // Si no hay usuario, redirigir al login
            router.push('/');
        }
    }, [router]);

    // Función de logout
    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    // Funciones para las ubicaciones
    const handleUbicacion = (nombre) => {
        // Guardar ubicación seleccionada en localStorage
        localStorage.setItem('ubicacion', nombre);
        router.push(`/dashboard/${nombre.toLowerCase()}`);
    };

    // ✅ Siempre mostrar loading si no está montado o no hay usuario
    if (!isMounted || isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Opciones del menú
    const ubicaciones = [
        {
            id: 'viacha-tilata',
            nombre: 'Viacha - Tilata',
            icono: '🏘️',
            color: 'from-blue-500 to-blue-600',
            descripcion: 'Zona norte'
        },
        {
            id: 'desaguadero',
            nombre: 'Desaguadero',
            icono: '🌊',
            color: 'from-cyan-500 to-cyan-600',
            descripcion: 'Zona oeste'
        },
        {
            id: 'quime',
            nombre: 'Quime',
            icono: '⛰️',
            color: 'from-emerald-500 to-emerald-600',
            descripcion: 'Zona sur'
        },
        {
            id: 'pueblos',
            nombre: 'Pueblos',
            icono: '🏡',
            color: 'from-amber-500 to-amber-600',
            descripcion: 'Zona rural'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🏰</span>
                        <h1 className="text-xl font-bold text-gray-800">Torre Fuerte</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 hidden sm:block">
                            👤 {user.nombre || user.email || 'Usuario'}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-red-600 hover:text-red-700 transition-colors font-medium"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6">
                {/* Título */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        Selecciona una ubicación
                    </h2>
                    <p className="text-gray-500 text-sm mt-2">
                        Elige la zona donde trabajarás hoy
                    </p>
                </div>

                {/* Grid de ubicaciones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {ubicaciones.map((ubicacion) => (
                        <motion.button
                            key={ubicacion.id}
                            whileHover={{
                                scale: 1.03,
                                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.2)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleUbicacion(ubicacion.nombre)}
                            className={`
                                bg-gradient-to-br ${ubicacion.color}
                                rounded-2xl shadow-lg hover:shadow-xl 
                                transition-all duration-300
                                flex flex-col items-center justify-center 
                                p-6 sm:p-8 text-white
                                relative overflow-hidden
                                min-h-[180px] sm:min-h-[200px]
                            `}
                        >
                            {/* Efecto de brillo */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

                            {/* Icono grande */}
                            <motion.span
                                className="text-6xl sm:text-7xl mb-3 relative z-10"
                                animate={{
                                    y: [0, -8, 0],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                {ubicacion.icono}
                            </motion.span>

                            {/* Nombre */}
                            <h3 className="text-xl sm:text-2xl font-bold relative z-10">
                                {ubicacion.nombre}
                            </h3>

                            {/* Descripción */}
                            <p className="text-sm opacity-90 mt-1 relative z-10">
                                {ubicacion.descripcion}
                            </p>

                            {/* Flecha indicadora */}
                            <motion.div
                                className="absolute bottom-4 right-4 opacity-50 relative z-10"
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <span className="text-2xl">→</span>
                            </motion.div>
                        </motion.button>
                    ))}
                </div>

                {/* Información adicional */}
                <div className="mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-6 max-w-2xl mx-auto">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📍</span>
                        <div>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Ubicación actual:</span> No seleccionada
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Selecciona una ubicación para comenzar a trabajar
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {new Date().toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">
                        Torre Fuerte v1.0 • {new Date().getFullYear()}
                    </p>
                </div>
            </main>
        </div>
    );
}