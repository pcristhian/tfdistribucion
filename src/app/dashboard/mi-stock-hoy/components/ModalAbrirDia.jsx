// components/ModalAbrirDia.js
'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function ModalAbrirDia({
    isOpen,
    onClose,
    onConfirm,
    fecha,
    productosCount = 0,
    loading = false,
    diaActivo = false,
    stocks = {}, // ✅ Stocks ingresados por el usuario
    productos = [], // ✅ Lista de productos para mostrar nombres
}) {
    if (!isOpen) return null;

    const formatNumber = (value) => {
        return parseInt(value || 0).toLocaleString('es-BO');
    };

    // ✅ Contar productos con stock
    const productosConStock = Object.values(stocks).filter(v => v !== null && v > 0).length;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                    className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                                🔓
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    Abrir Día
                                </h3>
                                <p className="text-sm text-white/80">
                                    {fecha ? new Date(fecha).toLocaleDateString('es-BO', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    }) : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contenido - Scrollable */}
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="mb-4">
                            <p className="text-gray-600 text-sm">
                                Se guardarán los siguientes stocks iniciales:
                            </p>
                        </div>

                        {/* ✅ Resumen de stocks */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-green-600">📊</span>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Resumen de stocks
                                </h4>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total productos:</span>
                                    <span className="font-semibold text-gray-800">
                                        {formatNumber(productosCount)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Productos con stock:</span>
                                    <span className="font-semibold text-green-600">
                                        {formatNumber(productosConStock)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Productos sin stock:</span>
                                    <span className="font-semibold text-yellow-600">
                                        {formatNumber(productosCount - productosConStock)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ✅ Lista de productos con stock */}
                        {productosConStock > 0 && (
                            <div className="bg-green-50 rounded-xl p-4 mb-4 border border-green-200 max-h-40 overflow-y-auto">
                                <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">
                                    Productos con stock
                                </h4>
                                <div className="space-y-1">
                                    {productos
                                        .filter(p => stocks[p.id] && stocks[p.id] > 0)
                                        .map(p => (
                                            <div key={p.id} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{p.nombre}</span>
                                                <span className="font-semibold text-gray-800">
                                                    {formatNumber(stocks[p.id])}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* ✅ Advertencia si no hay stocks */}
                        {productosConStock === 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <div className="flex items-start gap-2">
                                    <span className="text-yellow-600 text-lg">⚠️</span>
                                    <p className="text-xs text-yellow-700">
                                        <strong>No has ingresado ningún stock.</strong>
                                        ¿Estás seguro de que quieres abrir el día sin stocks?
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Advertencia si hay día activo */}
                        {diaActivo && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                                <div className="flex items-start gap-2">
                                    <span className="text-orange-600 text-lg">⚠️</span>
                                    <p className="text-xs text-orange-700">
                                        <strong>Ya hay un día activo.</strong> Para abrir este día,
                                        primero debes cerrar el día activo actual.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Resumen de lo que se hará */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <div className="flex items-start gap-2">
                                <span className="text-blue-600 text-lg">ℹ️</span>
                                <div className="text-xs text-blue-700">
                                    <p className="font-semibold">Se realizará lo siguiente:</p>
                                    <ul className="mt-1 space-y-0.5 list-disc list-inside">
                                        <li>Guardar stocks iniciales para {productosConStock} productos</li>
                                        <li>Crear registros para todos los días del mes</li>
                                        <li>Activar solo este día</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading || diaActivo}
                                className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-all shadow-lg flex items-center justify-center gap-2 ${diaActivo
                                        ? 'bg-gray-400 cursor-not-allowed shadow-gray-400/25'
                                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/25'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Abriendo...
                                    </>
                                ) : (
                                    <>
                                        <span>🔓</span>
                                        Abrir Día
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