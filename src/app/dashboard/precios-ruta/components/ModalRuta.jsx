// app/dashboard/precios-ruta/components/ModalRuta.js
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModalRuta({
    isOpen,
    onClose,
    onSave,
    ruta = null,
    loading = false,
    modo = 'crear', // 'crear' o 'editar'
}) {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        ciudad: '',
        zona: '',
        activo: true,
    });

    const [errores, setErrores] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (ruta && modo === 'editar') {
                setFormData({
                    nombre: ruta.nombre || '',
                    descripcion: ruta.descripcion || '',
                    ciudad: ruta.ciudad || '',
                    zona: ruta.zona || '',
                    activo: ruta.activo !== undefined ? ruta.activo : true,
                });
            } else {
                setFormData({
                    nombre: '',
                    descripcion: '',
                    ciudad: '',
                    zona: '',
                    activo: true,
                });
            }
            setErrores({});
        }
    }, [isOpen, ruta, modo]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        if (errores[name]) {
            setErrores(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrores = {};

        if (!formData.nombre.trim()) {
            newErrores.nombre = 'El nombre es requerido';
        } else if (formData.nombre.trim().length < 3) {
            newErrores.nombre = 'El nombre debe tener al menos 3 caracteres';
        }

        setErrores(newErrores);
        return Object.keys(newErrores).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            // ✅ Limpiar datos: campos vacíos se envían como null
            const datosEnviar = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion?.trim() || null,
                ciudad: formData.ciudad?.trim() || null,
                zona: formData.zona?.trim() || null,
                activo: formData.activo,
            };
            console.log('📤 Datos a enviar:', datosEnviar);
            onSave(datosEnviar);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

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
                                🗺️
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    Nueva Ruta
                                </h3>
                                <p className="text-sm text-white/80">
                                    Completa los datos de la ruta
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Formulario */}
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${errores.nombre ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Ej: Ruta Norte"
                                    autoFocus
                                />
                                {errores.nombre && (
                                    <p className="mt-1 text-xs text-red-500">{errores.nombre}</p>
                                )}
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                    placeholder="Descripción de la ruta (opcional)"
                                />
                            </div>

                            {/* Ciudad y Zona */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ciudad
                                    </label>
                                    <input
                                        type="text"
                                        name="ciudad"
                                        value={formData.ciudad}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        placeholder="Ej: Santa Cruz"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Zona
                                    </label>
                                    <input
                                        type="text"
                                        name="zona"
                                        value={formData.zona}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        placeholder="Ej: Norte"
                                    />
                                </div>
                            </div>

                            {/* Estado Activo */}
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="activo"
                                        checked={formData.activo}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Ruta activa
                                    </span>
                                </label>
                            </div>

                            <button type="submit" className="hidden" />
                        </form>
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
                                        Guardar Ruta
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