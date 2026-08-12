'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Tabla from './components/Tabla';

// 📦 DATOS ESPECÍFICOS DE VIACHA - TILATA
const VIACHA_TILATA = [
    // Tarjetas Viva
    { id: 1, codigo: 'V10', nombre: 'Tarjeta Viva 10', precio_base: 9.30, limite: 100, precio_post_limite: 9.25 },
    { id: 2, codigo: 'V20', nombre: 'Tarjeta Viva 20', precio_base: 19 },
    { id: 3, codigo: 'V30', nombre: 'Tarjeta Viva 30', precio_base: 28 },
    { id: 4, codigo: 'V50', nombre: 'Tarjeta Viva 50', precio_base: 46.50 },
    { id: 5, codigo: 'P40', nombre: 'Tarjeta Viva P40', precio_base: 40 },
    { id: 6, codigo: 'P100', nombre: 'Tarjeta Viva P100', precio_base: 99 },

    // Tarjetas Entel
    { id: 7, codigo: 'H10', nombre: 'Tarjeta Entel 10', precio_base: 9.30, limite: 200, precio_post_limite: 9.25 },
    { id: 8, codigo: 'H15', nombre: 'Tarjeta Entel 15', precio_base: 14, limite: 10, precio_post_limite: 14.90 },
    { id: 9, codigo: 'H30', nombre: 'Tarjeta Entel 30', precio_base: 28, limite: 10, precio_post_limite: 27.50 },
    { id: 10, codigo: 'H50', nombre: 'Tarjeta Entel 50', precio_base: 46.50, limite: 10, precio_post_limite: 46 },
    { id: 11, codigo: 'H100', nombre: 'Tarjeta Entel 100', precio_base: 94, limite: 5, precio_post_limite: 93 },

    // Tarjetas Tigo
    { id: 12, codigo: 'T10', nombre: 'Tarjeta Tigo 10', precio_base: 9.50, limite: 200, precio_post_limite: 9.45 },
    { id: 13, codigo: 'T20', nombre: 'Tarjeta Tigo 20', precio_base: 19 },
    { id: 14, codigo: 'T30', nombre: 'Tarjeta Tigo 30', precio_base: 29 },
    { id: 15, codigo: 'T50', nombre: 'Tarjeta Tigo 50', precio_base: 47.50 },
    { id: 16, codigo: 'T100', nombre: 'Tarjeta Tigo 100', precio_base: 95 },

    // Chips
    { id: 17, codigo: 'CHE', nombre: 'Chip Entel' },
    { id: 18, codigo: 'CHT', nombre: 'Chip Tigo' },
    { id: 19, codigo: 'CHV', nombre: 'Chip Viva' },
    { id: 20, codigo: 'CHEB', nombre: 'Chip Entel' },
    { id: 21, codigo: 'CHTB', nombre: 'Chip Tigo' },
];

export default function ViachaTilata() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [productos, setProductos] = useState([]);
    const [fechaActual, setFechaActual] = useState('');

    useEffect(() => {
        // Intentar cargar desde localStorage específico de Viacha
        const storedProductos = localStorage.getItem('productos_viacha_tilata');
        if (storedProductos) {
            try {
                const parsed = JSON.parse(storedProductos);
                if (parsed && parsed.length > 0) {
                    setProductos(parsed);
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Error al cargar productos:', error);
            }
        }

        // Si no hay datos guardados, usar el JSON de Viacha - Tilata
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
            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Tabla de productos */}
                <Tabla
                    productos={productos}
                    titulo="Productos en Stock"
                />

                {/* Resumen */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4"
                >
                    <div>
                        <p className="text-xs text-gray-500">Total Productos</p>
                        <p className="text-lg font-bold text-gray-800">{productos.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Stock Total</p>
                        <p className="text-lg font-bold text-gray-800">
                            {productos.reduce((sum, p) => sum + (p.stock || 0), 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Valor Total</p>
                        <p className="text-lg font-bold text-blue-600">
                            Bs. {productos.reduce((sum, p) => sum + ((p.stock || 0) * (p.precio_base || 0)), 0).toFixed(2)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Estado</p>
                        <p className="text-lg font-bold text-green-600">Activo</p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}