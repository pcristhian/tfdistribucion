// app/dashboard/precios-ruta/components/TablaPrecios.js
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TablaPrecios({
    productos = [],
    loading = false,
    onEdit,
    onEliminar,
    rutaSeleccionada
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEmpresa, setFilterEmpresa] = useState('todos');
    const [filterPersonalizado, setFilterPersonalizado] = useState('todos');

    // Obtener empresas únicas para el filtro
    const empresas = [...new Set(productos.map(p => p.empresa?.nombre).filter(Boolean))];

    // Filtrar productos
    const productosFiltrados = productos.filter(producto => {
        const term = searchTerm.toLowerCase();
        const matchSearch =
            producto.nombre.toLowerCase().includes(term) ||
            (producto.codigo && producto.codigo.toLowerCase().includes(term)) ||
            (producto.empresa?.nombre && producto.empresa.nombre.toLowerCase().includes(term));

        const matchEmpresa = filterEmpresa === 'todos' || producto.empresa?.nombre === filterEmpresa;

        let matchPersonalizado = true;
        if (filterPersonalizado === 'personalizados') {
            matchPersonalizado = producto.tiene_precio_personalizado === true;
        } else if (filterPersonalizado === 'default') {
            matchPersonalizado = producto.tiene_precio_personalizado === false;
        }

        return matchSearch && matchEmpresa && matchPersonalizado;
    });

    const formatPrice = (value) => {
        if (value === null || value === undefined) return '-';
        return `Bs. ${parseFloat(value).toFixed(2)}`;
    };

    if (!rutaSeleccionada) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-lg font-semibold text-gray-800">Selecciona una ruta</h3>
                <p className="text-gray-500 text-sm mt-1">
                    Elige una ruta para ver y gestionar sus precios
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (productos.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-800">No hay productos</h3>
                <p className="text-gray-500 text-sm mt-1">
                    No hay productos disponibles para esta ruta
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 ">
            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-black">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="🔍 Buscar producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <select
                        value={filterEmpresa}
                        onChange={(e) => setFilterEmpresa(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    >
                        <option value="todos">Todas las empresas</option>
                        {empresas.map(emp => (
                            <option key={emp} value={emp}>{emp}</option>
                        ))}
                    </select>
                    <select
                        value={filterPersonalizado}
                        onChange={(e) => setFilterPersonalizado(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    >
                        <option value="todos">Todos</option>
                        <option value="personalizados">✅ Personalizados</option>
                        <option value="default">📋 Por defecto</option>
                    </select>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Código
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Empresa
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Precio Base
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Precio Mínimo
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Precio Costo
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <AnimatePresence>
                                {productosFiltrados.map((producto, index) => {
                                    const tienePrecioPersonalizado = producto.tiene_precio_personalizado;
                                    const precio = producto.precio_ruta;

                                    return (
                                        <motion.tr
                                            key={producto.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={`hover:bg-gray-50 transition-colors ${tienePrecioPersonalizado ? 'bg-green-50/30' : ''
                                                }`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {producto.empresa?.color_primario && (
                                                        <div
                                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: producto.empresa.color_primario }}
                                                        />
                                                    )}
                                                    <span className="font-medium text-gray-800">
                                                        {producto.nombre}
                                                    </span>
                                                </div>
                                                {producto.descripcion && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {producto.descripcion}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-600">
                                                {producto.codigo || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {producto.empresa?.nombre || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {tienePrecioPersonalizado ? (
                                                    <span className="text-blue-600 font-bold">
                                                        {formatPrice(precio.precio_base)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        {formatPrice(producto.precio_base)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {tienePrecioPersonalizado ? (
                                                    <span className="text-gray-700">
                                                        {formatPrice(precio.precio_minimo)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        {formatPrice(producto.precio_minimo)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {tienePrecioPersonalizado ? (
                                                    <span className="text-gray-700">
                                                        {formatPrice(precio.precio_costo)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        {formatPrice(producto.precio_costo)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {tienePrecioPersonalizado ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        ✅ Personalizado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                        📋 Por defecto
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => onEdit(producto)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar precio"
                                                    >
                                                        ✏️
                                                    </button>
                                                    {tienePrecioPersonalizado && (
                                                        <button
                                                            onClick={() => onEliminar(producto.id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar precio personalizado"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                            <tr>
                                <td colSpan="8" className="px-4 py-3 text-sm text-gray-500">
                                    Mostrando {productosFiltrados.length} de {productos.length} productos
                                    {productos.filter(p => p.tiene_precio_personalizado).length > 0 && (
                                        <span className="ml-4 text-green-600">
                                            ✅ {productos.filter(p => p.tiene_precio_personalizado).length} personalizados
                                        </span>
                                    )}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}