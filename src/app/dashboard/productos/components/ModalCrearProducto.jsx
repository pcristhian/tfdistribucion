'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateProducto } from '../hooks/useCreateProducto';

export default function ModalCrearProducto({
    isOpen,
    onClose,
    onSave,
    empresas = [],
    categorias = [],
    loading = false,
}) {
    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        descripcion: '',
        empresa_id: '',
        categoria_id: '',
        precio_base: '',
        precio_minimo: '',
        precio_costo: '',
        corte: '',
        activo: true,
    });

    const [errores, setErrores] = useState({});
    const [codigoDisponible, setCodigoDisponible] = useState(null);
    const [verificandoCodigo, setVerificandoCodigo] = useState(false);

    // ✅ Usar el hook para verificar código
    const { verificarCodigo } = useCreateProducto();

    // Resetear formulario al abrir/cerrar
    useEffect(() => {
        if (isOpen) {
            setFormData({
                nombre: '',
                codigo: '',
                descripcion: '',
                empresa_id: '',
                categoria_id: '',
                precio_base: '',
                precio_minimo: '',
                precio_costo: '',
                corte: '',
                activo: true,
            });
            setErrores({});
            setCodigoDisponible(null);
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Limpiar error del campo
        if (errores[name]) {
            setErrores(prev => ({ ...prev, [name]: '' }));
        }

        // ✅ Verificar código usando el hook (sin API)
        if (name === 'codigo' && value.length >= 2) {
            // Limpiar timeout anterior
            if (window._codigoTimeout) {
                clearTimeout(window._codigoTimeout);
            }

            window._codigoTimeout = setTimeout(async () => {
                setVerificandoCodigo(true);
                try {
                    const result = await verificarCodigo(value);
                    setCodigoDisponible(result.disponible);
                } catch (error) {
                    console.error('Error al verificar código:', error);
                    setCodigoDisponible(null);
                } finally {
                    setVerificandoCodigo(false);
                }
            }, 500);
        } else if (name === 'codigo' && value.length < 2) {
            setCodigoDisponible(null);
            if (window._codigoTimeout) {
                clearTimeout(window._codigoTimeout);
            }
        }
    };

    const validateForm = () => {
        const newErrores = {};

        if (!formData.nombre.trim()) {
            newErrores.nombre = 'El nombre es requerido';
        }

        if (!formData.empresa_id) {
            newErrores.empresa_id = 'Selecciona una empresa';
        }

        if (!formData.categoria_id) {
            newErrores.categoria_id = 'Selecciona una categoría';
        }

        if (!formData.precio_base || parseFloat(formData.precio_base) <= 0) {
            newErrores.precio_base = 'El precio base debe ser mayor a 0';
        }

        if (!formData.precio_costo || parseFloat(formData.precio_costo) <= 0) {
            newErrores.precio_costo = 'El precio de costo debe ser mayor a 0';
        }

        if (formData.precio_minimo && parseFloat(formData.precio_minimo) > parseFloat(formData.precio_base)) {
            newErrores.precio_minimo = 'El precio mínimo no puede ser mayor al precio base';
        }

        if (formData.corte && parseFloat(formData.corte) < 0) {
            newErrores.corte = 'El corte no puede ser negativo';
        }

        if (codigoDisponible === false) {
            newErrores.codigo = 'Este código ya está en uso';
        }

        setErrores(newErrores);
        return Object.keys(newErrores).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
        }
    };

    if (!isOpen) return null;

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
                    className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                                ➕
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    Nuevo Producto
                                </h3>
                                <p className="text-sm text-white/80">
                                    Completa los datos del producto
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Formulario - Scrollable */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nombre y Código */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        placeholder="Ej: Tarjeta Entel 10"
                                    />
                                    {errores.nombre && (
                                        <p className="mt-1 text-xs text-red-500">{errores.nombre}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Código
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="codigo"
                                            value={formData.codigo}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm uppercase ${errores.codigo ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Ej: ENTEL10"
                                            maxLength={20}
                                        />
                                        {verificandoCodigo && (
                                            <div className="absolute right-3 top-2.5">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                            </div>
                                        )}
                                        {codigoDisponible === true && formData.codigo.length >= 2 && (
                                            <span className="absolute right-3 top-2.5 text-green-500 text-sm">✅</span>
                                        )}
                                        {codigoDisponible === false && (
                                            <span className="absolute right-3 top-2.5 text-red-500 text-sm">❌</span>
                                        )}
                                    </div>
                                    {errores.codigo && (
                                        <p className="mt-1 text-xs text-red-500">{errores.codigo}</p>
                                    )}
                                    {codigoDisponible === true && formData.codigo.length >= 2 && (
                                        <p className="mt-1 text-xs text-green-500">✅ Código disponible</p>
                                    )}
                                    {codigoDisponible === false && (
                                        <p className="mt-1 text-xs text-red-500">❌ Este código ya está en uso</p>
                                    )}
                                </div>
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
                                    placeholder="Descripción del producto (opcional)"
                                />
                            </div>

                            {/* Empresa y Categoría */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Empresa <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="empresa_id"
                                        value={formData.empresa_id}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${errores.empresa_id ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Seleccionar empresa</option>
                                        {empresas.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errores.empresa_id && (
                                        <p className="mt-1 text-xs text-red-500">{errores.empresa_id}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categoría <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="categoria_id"
                                        value={formData.categoria_id}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${errores.categoria_id ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Seleccionar categoría</option>
                                        {categorias.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errores.categoria_id && (
                                        <p className="mt-1 text-xs text-red-500">{errores.categoria_id}</p>
                                    )}
                                </div>
                            </div>

                            {/* Precios */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                </div>
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
                                </div>
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
                                </div>
                            </div>

                            {/* Corte y Estado */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Corte (opcional)
                                    </label>
                                    <input
                                        type="number"
                                        name="corte"
                                        value={formData.corte}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${errores.corte ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Ej: 5"
                                    />
                                    {errores.corte && (
                                        <p className="mt-1 text-xs text-red-500">{errores.corte}</p>
                                    )}
                                </div>
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
                                            Activo (disponible para ventas)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Botón submit oculto para el form */}
                            <button type="submit" className="hidden" />
                        </form>
                    </div>

                    {/* Footer con botones */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
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
                                        Guardar Producto
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