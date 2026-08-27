'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Tabla from './components/Tabla';

// 📦 DATOS ESPECÍFICOS DE VIACHA - TILATA
const VIACHA_TILATA = [
    // Tarjetas Viva
    { id: 1, codigo: 'V10', precio_base: 9.30 },
    { id: 2, codigo: 'V20', precio_base: 19 },
    { id: 3, codigo: 'V30', precio_base: 28 },
    { id: 4, codigo: 'V50', precio_base: 46.50 },
    { id: 5, codigo: 'P40', precio_base: 40 },
    { id: 6, codigo: 'P100', precio_base: 99 },

    // Tarjetas Entel
    { id: 7, codigo: 'H10', precio_base: 9.30 },
    { id: 8, codigo: 'H15', precio_base: 14 },
    { id: 9, codigo: 'H30', precio_base: 28 },
    { id: 10, codigo: 'H50', precio_base: 46.50 },
    { id: 11, codigo: 'H100', precio_base: 94 },

    // Tarjetas Tigo
    { id: 12, codigo: 'T10', precio_base: 9.50 },
    { id: 13, codigo: 'T20', precio_base: 19 },
    { id: 14, codigo: 'T30', precio_base: 29 },
    { id: 15, codigo: 'T50', precio_base: 47.50 },
    // Chips
    { id: 16, codigo: 'RE', precio_base: 1 },
    { id: 17, codigo: 'RP', precio_base: 1 },
    { id: 18, codigo: 'CHE#', precio_base: 12 },
    { id: 19, codigo: 'CHEB', precio_base: 15 },
    { id: 20, codigo: 'RV', precio_base: 1 },
];

export default function ViachaTilata() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [productos, setProductos] = useState([]);
    const [fechaActual, setFechaActual] = useState('');

    useEffect(() => {
        // Usar directamente el JSON de Viacha - Tilata
        // Agregar campo stock si no existe
        const productosConStock = VIACHA_TILATA.map(p => ({
            ...p,
            stock: p.stock || 0,
        }));
        setProductos(productosConStock);

        // Formatear fecha actual
        const hoy = new Date();
        setFechaActual(hoy.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }));

        setIsLoading(false);
    }, []);

    // Función para guardar en localStorage (opcional)
    const guardarProductos = () => {
        localStorage.setItem('productos_viacha_tilata', JSON.stringify(productos));
    };

    // Pantalla de carga
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header titulo="Viacha - Tilata" />
            <main className="max-w-7xl mx-auto px-1 py-1">
                {/* Tabla de productos */}
                <Tabla
                    productos={productos}
                    titulo="Ajuste de Tarjetas"
                />

            </main>
        </div>
    );
}