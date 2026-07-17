'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModalEditarProductos({
    isOpen,
    onClose,
    producto,
    onSave,
    empresas = [],
    categorias = [],
    loading = false
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
        activo: true
    });

    const [errors, setErrors] = useState({});

    // Cargar datos del producto cuando se abre el modal
    useEffect(() => {
        if (producto) {
            setFormData({
                nombre: producto.nombre || '',
                codigo: producto.codigo || '',
                descripcion: producto.descripcion || '',
                empresa_id: producto.empresa_id || '',
                categoria_id: producto.categoria_id || '',
                precio_base: producto.precio_base?.toString() || '',
                precio_minimo: producto.precio_minimo?.toString() || '',
                precio_costo: producto.precio_costo?.toString() || '',
                corte: producto.corte?.toString() || '',
                activo: producto.activo !== undefined ? producto.activo : true
            });
            setErrors({});
        }
    }, [producto]);

    // Validar formulario
    const validate = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }
        if (!formData.empresa_id) {
            newErrors.empresa_id = 'Selecciona una empresa';
        }
        if (!formData.categoria_id) {
            newErrors.categoria_id = 'Selecciona una categoría';
        }
        if (!formData.precio_base || parseFloat(formData.precio_base) <= 0) {
            newErrors.precio_base = 'El precio base debe ser mayor a 0';
        }
        if (!formData.precio_costo || parseFloat(formData.precio_costo) <= 0) {
            newErrors.precio_costo = 'El precio de costo debe ser mayor a 0';
        }
        if (formData.precio_minimo && parseFloat(formData.precio_minimo) > parseFloat(formData.precio_base)) {
            newErrors.precio_minimo = 'El precio mínimo no puede ser mayor al precio base';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const dataToSave = {
            ...formData,
            precio_base: parseFloat(formData.precio_base),
            precio_minimo: formData.precio_minimo ? parseFloat(formData.precio_minimo) : null,
            precio_costo: parseFloat(formData.precio_costo),
            corte: formData.corte ? parseFloat(formData.corte) : null,
            activo: formData.activo
        };

        await onSave(dataToSave);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center text-black">
                {/* Fondo oscuro */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
                        <h2 className="text-lg font-bold text-gray-800">
                            ✏️ Editar Producto
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Cuerpo del modal */}
                    <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: Entel 10"
                                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base ${errors.nombre ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.nombre && (
                                    <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
                                )}
                            </div>

                            {/* Código */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Código
                                </label>
                                <input
                                    type="text"
                                    name="codigo"
                                    value={formData.codigo}
                                    onChange={handleChange}
                                    placeholder="Ej: ENTEL10"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
                                />
                                <p className="text-xs text-gray-400 mt-1">Código único para identificar el producto</p>
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
                                    placeholder="Breve descripción del producto"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base resize-none"
                                />
                            </div>

                            {/* Empresa y Categoría */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Empresa *
                                    </label>
                                    <select
                                        name="empresa_id"
                                        value={formData.empresa_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base appearance-none bg-white ${errors.empresa_id ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Seleccionar</option>
                                        {empresas.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.empresa_id && (
                                        <p className="text-red-500 text-xs mt-1">{errors.empresa_id}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categoría *
                                    </label>
                                    <select
                                        name="categoria_id"
                                        value={formData.categoria_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base appearance-none bg-white ${errors.categoria_id ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Seleccionar</option>
                                        {categorias.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.categoria_id && (
                                        <p className="text-red-500 text-xs mt-1">{errors.categoria_id}</p>
                                    )}
                                </div>
                            </div>

                            {/* Precios */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Precio Base *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Bs.</span>
                                        <input
                                            type="number"
                                            name="precio_base"
                                            value={formData.precio_base}
                                            onChange={handleChange}
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base ${errors.precio_base ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                    </div>
                                    {errors.precio_base && (
                                        <p className="text-red-500 text-xs mt-1">{errors.precio_base}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Precio Mínimo
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Bs.</span>
                                        <input
                                            type="number"
                                            name="precio_minimo"
                                            value={formData.precio_minimo}
                                            onChange={handleChange}
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
                                        />
                                    </div>
                                    {errors.precio_minimo && (
                                        <p className="text-red-500 text-xs mt-1">{errors.precio_minimo}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Precio Costo *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Bs.</span>
                                        <input
                                            type="number"
                                            name="precio_costo"
                                            value={formData.precio_costo}
                                            onChange={handleChange}
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base ${errors.precio_costo ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                    </div>
                                    {errors.precio_costo && (
                                        <p className="text-red-500 text-xs mt-1">{errors.precio_costo}</p>
                                    )}
                                </div>
                            </div>

                            {/* Corte - SOLO corte, sin stock */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Corte (%)
                                </label>
                                <input
                                    type="number"
                                    name="corte"
                                    value={formData.corte}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="0.00"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
                                />
                            </div>

                            {/* Estado Activo */}
                            <div className="flex items-center gap-3 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="activo"
                                        checked={formData.activo}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-700">
                                        {formData.activo ? '✅ Activo' : '⛔ Inactivo'}
                                    </span>
                                </label>
                            </div>
                        </form>
                    </div>

                    {/* Footer con botones */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    Guardando...
                                </>
                            ) : (
                                '💾 Guardar Cambios'
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}