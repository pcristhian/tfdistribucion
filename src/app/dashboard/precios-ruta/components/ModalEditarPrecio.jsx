// app/dashboard/precios-ruta/components/ModalEditarPrecio.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModalEditarPrecio({
    isOpen,
    onClose,
    onSave,
    producto,
    loading = false,
}) {
    const [formData, setFormData] = useState({
        precio_base: '',
        precio_minimo: '',
        precio_costo: '',
    });
    const [errores, setErrores] = useState({});

    useEffect(() => {
        if (isOpen && producto) {
            // Cargar datos del producto (priorizar precio personalizado si existe)
            const precio = producto.precio_ruta;
            setFormData({
                precio_base: precio?.precio_base?.toString() || producto.precio_base?.toString() || '',
                precio_minimo: precio?.precio_minimo?.toString() || producto.precio_minimo?.toString() || '',
                precio_costo: precio?.precio_costo?.toString() || producto.precio_costo?.toString() || '',
            });
            setErrores({});
        }
    }, [isOpen, producto]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Limpiar error del campo
        if (errores[name]) {
            setErrores(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrores = {};

        if (!formData.precio_base || parseFloat(formData.precio_base) <= 0) {
            newErrores.precio_base = 'El precio base debe ser mayor a 0';
        }

        if (!formData.precio_costo || parseFloat(formData.precio_costo) <= 0) {
            newErrores.precio_costo = 'El precio de costo debe ser mayor a 0';
        }

        if (formData.precio_minimo && parseFloat(formData.precio_minimo) > parseFloat(formData.precio_base)) {
            newErrores.precio_minimo = 'El precio mínimo no puede ser mayor al precio base';
        }

        setErrores(newErrores);
        return Object.keys(newErrores).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onSave({
                precio_base: parseFloat(formData.precio_base),
                precio_minimo: formData.precio_minimo ? parseFloat(formData.precio_minimo) : null,
                precio_costo: parseFloat(formData.precio_costo),
            });
        }
    };

    if (!isOpen || !producto) return null;

    const formatPrice = (value) => {
        if (value === null || value === undefined) return '0.00';
        return parseFloat(value).toFixed(2);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-black">
                {/* Fondo oscuro */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                                💰
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    Editar Precio
                                </h3>
                                <p className="text-sm text-white/80 truncate max-w-[200px]">
                                    {producto.nombre}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-6">
                        <div className="space-y-4">
                            {/* Precio Base */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio Base (Bs.) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="precio_base"
                                    value={formData.precio_base}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${errores.precio_base ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="0.00"
                                />
                                {errores.precio_base && (
                                    <p className="mt-1 text-xs text-red-500">{errores.precio_base}</p>
                                )}
                                {producto.precio_base && !producto.precio_ruta && (
                                    <p className="mt-1 text-xs text-gray-400">
                                        Precio por defecto: Bs. {formatPrice(producto.precio_base)}
                                    </p>
                                )}
                            </div>

                            {/* Precio Costo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio Costo (Bs.) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="precio_costo"
                                    value={formData.precio_costo}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${errores.precio_costo ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="0.00"
                                />
                                {errores.precio_costo && (
                                    <p className="mt-1 text-xs text-red-500">{errores.precio_costo}</p>
                                )}
                                {producto.precio_costo && !producto.precio_ruta && (
                                    <p className="mt-1 text-xs text-gray-400">
                                        Precio por defecto: Bs. {formatPrice(producto.precio_costo)}
                                    </p>
                                )}
                            </div>

                            {/* Precio Mínimo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio Mínimo (Bs.)
                                </label>
                                <input
                                    type="number"
                                    name="precio_minimo"
                                    value={formData.precio_minimo}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${errores.precio_minimo ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Opcional"
                                />
                                {errores.precio_minimo && (
                                    <p className="mt-1 text-xs text-red-500">{errores.precio_minimo}</p>
                                )}
                                {producto.precio_minimo && !producto.precio_ruta && (
                                    <p className="mt-1 text-xs text-gray-400">
                                        Precio por defecto: Bs. {formatPrice(producto.precio_minimo)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <span>💾</span>
                                        Guardar Precio
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}