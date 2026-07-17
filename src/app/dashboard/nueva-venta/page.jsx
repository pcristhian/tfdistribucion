'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../../login/hook/useLogin';
import Header from './components/Header';
import Tabla from './components/Tabla';

export default function NuevaVentaPage() {
    const { getUser } = useLogin();
    const router = useRouter();
    const user = getUser();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    // ✅ Siempre mostrar el mismo loading durante la hidratación
    if (!isMounted || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header titulo="Nueva Venta" />

            {/* Contenido principal */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
                <Tabla />
            </main>
        </div>
    );
}