'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../login/hook/useLogin';

export default function DashboardPage() {
    const { getUser, logout } = useLogin();
    const router = useRouter();
    const user = getUser();

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
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
                        <span className="text-sm text-gray-600">
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

            <main className="max-w-7xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        ¡Bienvenido, {user.nombre}!
                    </h2>
                    <p className="text-gray-600">
                        Aquí comenzaremos a construir el dashboard de ventas.
                    </p>
                </div>
            </main>
        </div>
    );
}