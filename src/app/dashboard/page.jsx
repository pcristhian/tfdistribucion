// src/app/dashboard/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../login/hook/useLogin';
import { motion } from 'framer-motion';

export default function DashboardPage() {
    const { getUser, logout } = useLogin();
    const router = useRouter();
    const user = getUser();
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        if (!user) {
            router.push('/login');
        } else {
            setIsLoading(false);
        }
    }, [user, router]);

    // Funciones para los botones
    const handleNuevaVenta = () => {
        router.push('/dashboard/nueva-venta');
    };

    const handleHistorialHoy = () => {
        router.push('/dashboard/historial-hoy');
    };
    const handleProductos = () => {
        router.push('/dashboard/productos');
    };
    const handleMiStockHoy = () => {
        router.push('/dashboard/mi-stock-hoy');
    };
    const handlePreciosRuta = () => {
        router.push('/dashboard/precios-ruta');
    };

    // ✅ Siempre mostrar loading si no está montado o no hay usuario
    if (!isMounted || isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm p-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🏰</span>
                        <h1 className="text-xl font-bold text-gray-800">Torre Fuerte</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 hidden sm:block">
                            👤 {user.nombre} {user.apellido || ''}
                        </span>
                        <button
                            onClick={logout}
                            className="text-sm text-red-600 hover:text-red-700 transition-colors"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 sm:p-6">
                {/* Botones - TAMAÑO AJUSTADO PARA MÓVIL */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
                    {/* Nueva Venta */}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleNuevaVenta}
                        className="aspect-[4/3] bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center p-4 sm:p-6 text-white"
                    >
                        <span className="text-4xl sm:text-5xl mb-2 sm:mb-3">💰</span>
                        <h3 className="text-base sm:text-xl font-bold">Nueva Venta</h3>
                        <p className="text-xs sm:text-sm text-blue-100 mt-1">Registrar</p>
                    </motion.button>

                    {/* Historial Hoy */}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleHistorialHoy}
                        className="aspect-[4/3] bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center p-4 sm:p-6 text-white"
                    >
                        <span className="text-4xl sm:text-5xl mb-2 sm:mb-3">📊</span>
                        <h3 className="text-base sm:text-xl font-bold">Historial Hoy</h3>
                        <p className="text-xs sm:text-sm text-purple-100 mt-1">Ventas del día</p>
                    </motion.button>
                    {/* Productos */}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleProductos}
                        className="aspect-[4/3] bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center p-4 sm:p-6 text-white"
                    >
                        <span className="text-4xl sm:text-5xl mb-2 sm:mb-3">📊</span>
                        <h3 className="text-base sm:text-xl font-bold">Productos</h3>
                        <p className="text-xs sm:text-sm text-purple-100 mt-1">Ver productos</p>
                    </motion.button>
                    {/* Mi Stock hoy */}
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleMiStockHoy}
                        className="aspect-[4/3] bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center p-4 sm:p-6 text-white"
                    >
                        <span className="text-4xl sm:text-5xl mb-2 sm:mb-3">📊</span>
                        <h3 className="text-base sm:text-xl font-bold">Stock Hoy</h3>
                        <p className="text-xs sm:text-sm text-purple-100 mt-1">Ver mi Stock</p>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePreciosRuta}
                        className="aspect-[4/3] bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center p-4 sm:p-6 text-white"
                    >
                        <span className="text-4xl sm:text-5xl mb-2 sm:mb-3">📊</span>
                        <h3 className="text-base sm:text-xl font-bold">Rutas y precio</h3>
                        <p className="text-xs sm:text-sm text-purple-100 mt-1">Cambiar precios de todas las rutas</p>
                    </motion.button>
                </div>

                {/* Bienvenida - Más compacta en móvil */}
                <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-6 max-w-2xl mx-auto">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                        ¡Bienvenido, {user.nombre}! 👋
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {new Date().toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Listo para trabajar
                    </div>
                </div>
            </main>
        </div>
    );
}