'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tabla({
    productos = [],
    loading = false,
    onEdit,
    onToggleActivo
}) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActivo, setFilterActivo] = useState('todos');

    // Filtrar productos
    const filteredProductos = productos.filter(producto => {
        const term = searchTerm.toLowerCase();
        const matchSearch =
            producto.nombre.toLowerCase().includes(term) ||
            (producto.codigo && producto.codigo.toLowerCase().includes(term)) ||
            (producto.empresa?.nombre && producto.empresa.nombre.toLowerCase().includes(term)) ||
            (producto.categoria?.nombre && producto.categoria.nombre.toLowerCase().includes(term));

        let matchEstado = true;
        if (filterActivo === 'activos') {
            matchEstado = producto.activo === true;
        } else if (filterActivo === 'inactivos') {
            matchEstado = producto.activo === false;
        }

        return matchSearch && matchEstado;
    });

    const formatPrice = (value) => {
        return `Bs. ${parseFloat(value || 0).toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Barra de filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="space-y-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="🔍 Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <button
                            onClick={() => setFilterActivo('todos')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filterActivo === 'todos'
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todos ({productos.length})
                        </button>
                        <button
                            onClick={() => setFilterActivo('activos')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filterActivo === 'activos'
                                ? 'bg-green-600 text-white'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                        >
                            ✅ Activos
                        </button>
                        <button
                            onClick={() => setFilterActivo('inactivos')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filterActivo === 'inactivos'
                                ? 'bg-red-600 text-white'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                        >
                            ⛔ Inactivos
                        </button>
                    </div>
                </div>
            </div>

            {/* Resultados */}
            {filteredProductos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold text-gray-800">No hay productos</h3>
                    <p className="text-gray-500 text-sm mt-1">
                        {searchTerm || filterActivo !== 'todos'
                            ? 'No coinciden con los filtros aplicados'
                            : 'Comienza creando tu primer producto'}
                    </p>
                    {(searchTerm || filterActivo !== 'todos') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterActivo('todos');
                            }}
                            className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <AnimatePresence>
                    <div className="space-y-3">
                        {filteredProductos.map((producto, index) => (
                            <motion.div
                                key={producto.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-4">
                                    {/* Header: Código + Estado */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{
                                                    backgroundColor: producto.empresa?.color_primario || '#6366f1'
                                                }}
                                            />
                                            <span className="font-mono text-xs text-gray-500">
                                                {producto.codigo || 'Sin código'}
                                            </span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${producto.activo
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {producto.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>

                                    {/* Nombre del producto */}
                                    <h3 className="text-base font-bold text-gray-800 mb-1">
                                        {producto.nombre}
                                    </h3>

                                    {/* Descripción */}
                                    {producto.descripcion && (
                                        <p className="text-xs text-gray-400 mb-3">
                                            {producto.descripcion}
                                        </p>
                                    )}

                                    {/* Grid de información - SIN STOCK */}
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="bg-gray-50 rounded-lg p-2">
                                            <p className="text-[10px] text-gray-400 uppercase">Empresa</p>
                                            <p className="text-sm font-medium text-gray-700">
                                                {producto.empresa?.nombre || '-'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-2">
                                            <p className="text-[10px] text-gray-400 uppercase">Categoría</p>
                                            <p className="text-sm font-medium text-gray-700">
                                                {producto.categoria?.nombre || '-'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-2">
                                            <p className="text-[10px] text-gray-400 uppercase">Precio Base</p>
                                            <p className="text-sm font-bold text-blue-600">
                                                {formatPrice(producto.precio_base)}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-2">
                                            <p className="text-[10px] text-gray-400 uppercase">Precio Costo</p>
                                            <p className="text-sm text-gray-600">
                                                {formatPrice(producto.precio_costo)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* ❌ SECCIÓN DE STOCK ELIMINADA */}

                                    {/* Acciones */}
                                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                                        <button
                                            onClick={() => onEdit?.(producto)}
                                            className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={() => onToggleActivo?.(producto)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${producto.activo
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                }`}
                                        >
                                            {producto.activo ? '🔴 Desactivar' : '🟢 Activar'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            )}

            {/* Contador */}
            {filteredProductos.length > 0 && (
                <div className="text-center text-xs text-gray-400 py-2">
                    Mostrando {filteredProductos.length} de {productos.length} productos
                </div>
            )}
        </div>
    );
}