'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../../login/hook/useLogin';
import { useStockDiario } from './hooks/useStockDiario';
import { useEditProductos } from '../productos/hooks/useEditProducto';
import Header from './components/Header';
import Tabla from './components/Tabla';
import DiasMes from './components/DiasMes';

export default function MiStockHoyPage() {
    const { getUser } = useLogin();
    const router = useRouter();
    const user = getUser();

    const {
        loading: stockLoading,
        error,
        getStockPorFecha,
        crearVenta,
        anularVenta,
        getStockHoy,
    } = useStockDiario();

    const { getProductos } = useEditProductos();

    const [stockData, setStockData] = useState([]);
    const [productos, setProductos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
    const [showModalVenta, setShowModalVenta] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidadVenta, setCantidadVenta] = useState(1);
    const [mostrarCalendario, setMostrarCalendario] = useState(true);
    const [productosCargados, setProductosCargados] = useState(false);

    const isFirstRender = useRef(true);

    // Cargar productos disponibles
    const cargarProductos = useCallback(async () => {
        try {
            const data = await getProductos(false); // Obtener todos (activos e inactivos)
            if (data && data.length > 0) {
                setProductos(data);
            }
            setProductosCargados(true);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            setProductosCargados(true);
        }
    }, [getProductos]);

    // Cargar datos del stock por fecha
    const cargarStockPorFecha = useCallback(async (fecha) => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const data = await getStockPorFecha(user.id, fecha);
            setStockData(data || []);
        } catch (error) {
            console.error('Error al cargar stock:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, getStockPorFecha]);

    // Cargar stock del día actual
    const cargarStockHoy = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const data = await getStockHoy(user.id);
            setStockData(data || []);
        } catch (error) {
            console.error('Error al cargar stock del día:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, getStockHoy]);

    // Manejar selección de día
    const handleSelectDia = useCallback((fecha, tieneDatos) => {
        setFechaSeleccionada(fecha);
        setDiaSeleccionado(fecha);
        setMostrarCalendario(false);
        if (tieneDatos) {
            cargarStockPorFecha(fecha);
        } else {
            // Si no tiene datos, mostrar tabla vacía pero con productos
            setStockData([]);
            setIsLoading(false);
        }
    }, [cargarStockPorFecha]);

    // Volver al calendario
    const handleVolverCalendario = useCallback(() => {
        setMostrarCalendario(true);
        setDiaSeleccionado(null);
        setFechaSeleccionada(null);
        setStockData([]);
        setIsLoading(false);
    }, []);

    // Manejar actualización de stock (desde input editable)
    const handleUpdateStock = useCallback(async (stockId, nuevoStock) => {
        if (fechaSeleccionada) {
            await cargarStockPorFecha(fechaSeleccionada);
        } else {
            await cargarStockHoy();
        }
    }, [fechaSeleccionada, cargarStockPorFecha, cargarStockHoy]);

    // Verificar autenticación y cargar datos
    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (isFirstRender.current) {
            isFirstRender.current = false;
            cargarProductos();
        }
    }, [user, router, cargarProductos]);

    // Cargar stock del día actual después de cargar productos
    useEffect(() => {
        if (productosCargados && mostrarCalendario) {
            cargarStockHoy();
        }
    }, [productosCargados, mostrarCalendario, cargarStockHoy]);

    // Manejar venta
    const handleVender = useCallback((item) => {
        if (!item.id) {
            alert('⚠️ Este producto no tiene stock registrado. Ingresa un stock inicial primero.');
            return;
        }
        if (item.stock_actual <= 0) {
            alert('⚠️ No hay stock disponible para este producto.');
            return;
        }
        setProductoSeleccionado(item);
        setCantidadVenta(1);
        setShowModalVenta(true);
    }, []);

    // Confirmar venta
    const handleConfirmarVenta = useCallback(async () => {
        if (!productoSeleccionado || cantidadVenta <= 0) {
            alert('Cantidad inválida');
            return;
        }

        if (cantidadVenta > productoSeleccionado.stock_actual) {
            alert(`Stock insuficiente. Disponible: ${productoSeleccionado.stock_actual}`);
            return;
        }

        const precio = productoSeleccionado.producto?.precio_base || 0;
        const total = precio * cantidadVenta;

        const ventaData = {
            distribuidor_id: user.id,
            cliente_id: null, // Puede ser null si es venta sin cliente
            producto_id: productoSeleccionado.producto_id,
            stock_diario_id: productoSeleccionado.id,
            cantidad: cantidadVenta,
            subtotal: total,
            descuento_total: 0,
            total: total,
            observacion: `Venta de ${cantidadVenta} x ${productoSeleccionado.producto?.nombre}`,
        };

        const result = await crearVenta(ventaData);
        if (result) {
            setShowModalVenta(false);
            setProductoSeleccionado(null);
            setCantidadVenta(1);
            // Recargar stock
            if (fechaSeleccionada) {
                await cargarStockPorFecha(fechaSeleccionada);
            } else {
                await cargarStockHoy();
            }
        }
    }, [productoSeleccionado, cantidadVenta, user?.id, crearVenta, fechaSeleccionada, cargarStockPorFecha, cargarStockHoy]);

    // Cerrar modal de venta
    const handleCloseModalVenta = useCallback(() => {
        setShowModalVenta(false);
        setProductoSeleccionado(null);
        setCantidadVenta(1);
    }, []);

    if (isLoading && !productosCargados) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header titulo="Mi Stock Hoy" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Calendario */}
                {mostrarCalendario && (
                    <div className="mb-6">
                        <DiasMes
                            distribuidorId={user?.id}
                            onSelectDia={handleSelectDia}
                            diaSeleccionado={diaSeleccionado}
                        />
                    </div>
                )}

                {/* Vista del día seleccionado */}
                {!mostrarCalendario && fechaSeleccionada && (
                    <>
                        {/* Encabezado del día seleccionado */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleVolverCalendario}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                                    aria-label="Volver al calendario"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        📅 {new Date(fechaSeleccionada).toLocaleDateString('es-BO', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {stockData.length} productos registrados
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleVolverCalendario}
                                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    <span>✕</span> Cerrar
                                </button>
                            </div>
                        </div>

                        {/* Tabla de stock */}
                        <Tabla
                            stockData={stockData}
                            loading={stockLoading || isLoading}
                            onVender={handleVender}
                            onAnular={null}
                            onUpdateStock={handleUpdateStock}
                            diaSeleccionado={fechaSeleccionada}
                            productosDisponibles={productos}
                        />

                        {/* Error */}
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                ❌ {error}
                            </div>
                        )}
                    </>
                )}

                {/* Mensaje si no hay productos */}
                {productos.length === 0 && productosCargados && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-lg font-semibold text-gray-800">No hay productos configurados</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            Ve al módulo de productos para agregar productos
                        </p>
                        <button
                            onClick={() => router.push('/dashboard/productos')}
                            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Ir a Productos
                        </button>
                    </div>
                )}

                {/* Mensaje de carga para el calendario */}
                {mostrarCalendario && !productosCargados && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Cargando productos...</p>
                    </div>
                )}
            </main>

            {/* Modal de venta */}
            {showModalVenta && productoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                💰 Vender Producto
                            </h3>
                            <button
                                onClick={handleCloseModalVenta}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-500">Producto</p>
                                <p className="font-medium text-gray-800">
                                    {productoSeleccionado.producto?.nombre}
                                </p>
                                <p className="text-xs text-gray-400">
                                    Stock disponible: {productoSeleccionado.stock_actual}
                                </p>
                                <p className="text-sm text-blue-600 font-semibold">
                                    Precio: Bs. {parseFloat(productoSeleccionado.producto?.precio_base || 0).toFixed(2)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cantidad a vender
                                </label>
                                <input
                                    type="number"
                                    value={cantidadVenta}
                                    onChange={(e) => setCantidadVenta(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                    max={productoSeleccionado.stock_actual}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Máximo: {productoSeleccionado.stock_actual} unidades
                                </p>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total a cobrar:</span>
                                    <span className="font-bold text-blue-600 text-lg">
                                        Bs. {(parseFloat(productoSeleccionado.producto?.precio_base || 0) * cantidadVenta).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleCloseModalVenta}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmarVenta}
                                    disabled={cantidadVenta <= 0 || cantidadVenta > productoSeleccionado.stock_actual}
                                    className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ✅ Vender
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}