// components/ModalCerrarDia.js
'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function ModalCerrarDia({
    isOpen,
    onClose,
    onConfirm,
    fecha,
    resumen,
    loading = false
}) {
    if (!isOpen) return null;

    const formatPrice = (value) => {
        return `Bs. ${parseFloat(value || 0).toFixed(2)}`;
    };

    const formatNumber = (value) => {
        return parseInt(value || 0).toLocaleString('es-BO');
    };

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
                    className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                                🔒
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    Cerrar Día
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

                    {/* Contenido */}
                    <div className="p-6">
                        <div className="mb-4">
                            <p className="text-gray-600 text-sm">
                                ¿Estás seguro de cerrar el día? Esta acción:
                            </p>
                            <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-0.5">•</span>
                                    <span>Finalizará el registro de ventas del día</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-0.5">•</span>
                                    <span>Calculará el stock final automáticamente</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-0.5">•</span>
                                    <span>No se podrán modificar los datos después</span>
                                </li>
                            </ul>
                        </div>

                        {/* Resumen del día */}
                        {resumen && (
                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                    Resumen del día
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Productos vendidos:</span>
                                        <span className="font-semibold text-gray-700">
                                            {formatNumber(resumen.total_vendido || 0)} unidades
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total efectivo:</span>
                                        <span className="font-semibold text-green-600">
                                            {formatPrice(resumen.total_efectivo || 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Productos activos:</span>
                                        <span className="font-semibold text-gray-700">
                                            {formatNumber(resumen.total_productos || 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                        <span className="text-gray-500">Stock inicial total:</span>
                                        <span className="font-semibold text-gray-700">
                                            {formatNumber(resumen.stock_inicial_total || 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Stock final total:</span>
                                        <span className="font-semibold text-gray-700">
                                            {formatNumber(resumen.stock_final_total || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Advertencia */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <div className="flex items-start gap-2">
                                <span className="text-yellow-600 text-lg">⚠️</span>
                                <p className="text-xs text-yellow-700">
                                    <strong>Importante:</strong> Una vez cerrado el día, no podrás
                                    modificar los stocks ni registrar más ventas para esta fecha.
                                </p>
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
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Cerrando...
                                    </>
                                ) : (
                                    <>
                                        <span>🔒</span>
                                        Cerrar Día
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