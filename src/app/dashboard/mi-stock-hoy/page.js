// app/dashboard/mi-stock-hoy/page.js
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../../login/hook/useLogin';
import { useStockDiario } from './hooks/useStockDiario';
import { useEditProductos } from '../productos/hooks/useEditProducto';
import Header from './components/Header';
import Tabla from './components/Tabla';
import DiasMes from './components/DiasMes';
import ModalCerrarDia from './components/ModalCerrarDia';
import ModalAbrirDia from './components/ModalAbrirDia';
import { useModal } from './hooks/useModal';
import { getBoliviaDateString, isPastDate } from '@/lib/boliviaTime'; // ✅ Importar helpers

export default function MiStockHoyPage() {
    const { getUser } = useLogin();
    const router = useRouter();
    const user = getUser();

    const {
        loading: stockLoading,
        error,
        getStockPorFecha,
        getStockHoy,
        abrirDia,
        actualizarStockProducto,
        cerrarDia,
    } = useStockDiario();

    const { getProductos } = useEditProductos();

    const [stockData, setStockData] = useState(null);
    const [productos, setProductos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
    const [mostrarCalendario, setMostrarCalendario] = useState(true);
    const [productosCargados, setProductosCargados] = useState(false);
    const [abriendoDia, setAbriendoDia] = useState(false);
    const [diaActivo, setDiaActivo] = useState(false);
    const [fechaActiva, setFechaActiva] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [cerrandoDia, setCerrandoDia] = useState(false);
    const [stocksActuales, setStocksActuales] = useState({});

    // ✅ Modales
    const modalCerrar = useModal();
    const modalAbrir = useModal();

    const isFirstRender = useRef(true);

    const cargarProductos = useCallback(async () => {
        try {
            const data = await getProductos(false);
            if (data && data.length > 0) {
                setProductos(data);
            }
            setProductosCargados(true);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            setProductosCargados(true);
        }
    }, [getProductos]);

    const cargarStockPorFecha = useCallback(async (fecha) => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const data = await getStockPorFecha(user.id, fecha);
            setStockData(data);
            setRefreshKey(prev => prev + 1);

            if (data?.estado === 'activo') {
                setDiaActivo(true);
                setFechaActiva(fecha);
            } else {
                setDiaActivo(false);
                setFechaActiva(null);
            }
        } catch (error) {
            console.error('Error al cargar stock:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, getStockPorFecha]);

    const cargarStockHoy = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            // ✅ Usar getStockHoy que ya usa Bolivia internamente
            const data = await getStockHoy(user.id);
            setStockData(data);
            setRefreshKey(prev => prev + 1);

            if (data?.estado === 'activo') {
                setDiaActivo(true);
                setFechaActiva(data.fecha);
            } else {
                setDiaActivo(false);
                setFechaActiva(null);
            }
        } catch (error) {
            console.error('Error al cargar stock del día:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, getStockHoy]);

    const esPasado = useCallback(() => {
        if (!fechaSeleccionada) return false;

        const fecha = new Date(fechaSeleccionada);
        const hoy = new Date(getBoliviaDateString());

        // Resetear horas para comparar solo fechas
        fecha.setHours(0, 0, 0, 0);
        hoy.setHours(0, 0, 0, 0);

        // ✅ Solo es pasado si la fecha es MENOR que hoy
        return fecha < hoy;
    }, [fechaSeleccionada]);


    const handleSelectDia = useCallback((fecha, tieneDatos, esActivo) => {
        setFechaSeleccionada(fecha);
        setDiaSeleccionado(fecha);
        setMostrarCalendario(false);

        if (esActivo) {
            setDiaActivo(true);
            setFechaActiva(fecha);
        } else {
            setDiaActivo(false);
            setFechaActiva(null);
        }

        if (tieneDatos) {
            cargarStockPorFecha(fecha);
        } else {
            setStockData(null);
            setRefreshKey(prev => prev + 1);
            setIsLoading(false);
        }
    }, [cargarStockPorFecha]);

    const handleDiaActivo = useCallback((fecha) => {
        if (fecha) {
            setFechaActiva(fecha);
            if (fechaSeleccionada === fecha) {
                setDiaActivo(true);
            }
        } else {
            setFechaActiva(null);
            if (fechaSeleccionada) {
                setDiaActivo(false);
            }
        }
    }, [fechaSeleccionada]);

    const handleVolverCalendario = useCallback(() => {
        setMostrarCalendario(true);
        setDiaSeleccionado(null);
        setFechaSeleccionada(null);
        setStockData(null);
        setDiaActivo(false);
        setFechaActiva(null);
        setIsLoading(false);
    }, []);

    const puedeAbrirDia = useCallback(() => {
        if (!fechaSeleccionada) return false;

        const fecha = new Date(fechaSeleccionada);
        const hoy = new Date(getBoliviaDateString());

        fecha.setHours(0, 0, 0, 0);
        hoy.setHours(0, 0, 0, 0);

        // ✅ Puede abrir si es hoy o futuro
        return fecha >= hoy;
    }, [fechaSeleccionada]);
    // ✅ Abrir modal de apertura
    const handleAbrirDia = useCallback(() => {
        if (!user?.id || !fechaSeleccionada) return;

        if (diaActivo) {
            alert('⚠️ Ya hay un día activo. Cierra el día actual antes de abrir otro.');
            return;
        }

        // ✅ Obtener los stocks actuales de la tabla
        if (typeof window !== 'undefined' && window.__getStocksActuales) {
            const stocks = window.__getStocksActuales();
            setStocksActuales(stocks);
            modalAbrir.openModal();
        } else {
            modalAbrir.openModal();
        }
    }, [user?.id, fechaSeleccionada, diaActivo, modalAbrir]);

    // ✅ Confirmar apertura de día
    const confirmarAbrirDia = useCallback(async () => {
        if (!user?.id || !fechaSeleccionada) return;

        setAbriendoDia(true);
        try {
            // ✅ Primero guardar los stocks
            let stocksGuardados = false;
            if (typeof window !== 'undefined' && window.__guardarTodosLosStocks) {
                stocksGuardados = await window.__guardarTodosLosStocks();
            }

            if (!stocksGuardados) {
                console.warn('⚠️ No se pudieron guardar todos los stocks');
            }

            // ✅ Preparar productos para abrir el día
            const productosStock = productos.map(p => ({
                producto_id: p.id,
                codigo: p.codigo || '',
                nombre: p.nombre || '',
                stock_inicial: stocksActuales[p.id] || 0,
                precio_base: p.precio_base || 0,
                empresa: p.empresa?.nombre || '',
                empresa_color: p.empresa?.color_primario || '#6366f1',
            }));

            // ✅ Abrir el día
            const result = await abrirDia(user.id, productosStock, fechaSeleccionada);
            if (result) {
                modalAbrir.closeModal();
                alert('✅ Día abierto correctamente.');
                await cargarStockPorFecha(fechaSeleccionada);
                setDiaActivo(true);
                setFechaActiva(fechaSeleccionada);
                setRefreshKey(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error al abrir día:', error);
            alert('❌ Error al abrir el día');
        } finally {
            setAbriendoDia(false);
        }
    }, [user?.id, fechaSeleccionada, productos, stocksActuales, abrirDia, cargarStockPorFecha, modalAbrir]);

    // ✅ Cerrar día
    const handleCerrarDia = useCallback(() => {
        if (!user?.id || !fechaSeleccionada) return;

        if (!diaActivo) {
            alert('⚠️ No hay un día activo para cerrar.');
            return;
        }

        modalCerrar.openModal();
    }, [user?.id, fechaSeleccionada, diaActivo, modalCerrar]);

    // ✅ Confirmar cierre de día
    const confirmarCerrarDia = useCallback(async () => {
        if (!user?.id || !fechaSeleccionada) return;

        setCerrandoDia(true);
        try {
            const result = await cerrarDia(user.id);
            if (result) {
                modalCerrar.closeModal();
                setDiaActivo(false);
                setFechaActiva(null);
                await cargarStockPorFecha(fechaSeleccionada);
                setRefreshKey(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error al cerrar día:', error);
            alert('❌ Error al cerrar el día');
        } finally {
            setCerrandoDia(false);
        }
    }, [user?.id, fechaSeleccionada, cerrarDia, cargarStockPorFecha, modalCerrar]);

    // ✅ SOLO GUARDA - NO RECARGA
    const handleUpdateStock = useCallback(async (distribuidorId, productoId, nuevoStock) => {
        if (!distribuidorId || !productoId) return;
        try {
            return await actualizarStockProducto(distribuidorId, productoId, nuevoStock);
        } catch (error) {
            console.error('Error al actualizar stock:', error);
            return null;
        }
    }, [actualizarStockProducto]);

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

    useEffect(() => {
        if (productosCargados && mostrarCalendario) {
            cargarStockHoy();
        }
    }, [productosCargados, mostrarCalendario, cargarStockHoy]);

    if (isLoading && !productosCargados) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const cantidadProductos = stockData?.productos?.length || 0;
    const resumenDia = stockData?.resumen || {};

    return (
        <div className="min-h-screen bg-gray-50">
            <Header titulo="Mi Stock Hoy" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
                {mostrarCalendario && (
                    <div className="mb-6" key={refreshKey}>
                        <DiasMes
                            distribuidorId={user?.id}
                            onSelectDia={handleSelectDia}
                            diaSeleccionado={diaSeleccionado}
                            onDiaActivo={handleDiaActivo}
                        />
                    </div>
                )}

                {!mostrarCalendario && fechaSeleccionada && (
                    <>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
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
                                    <h2 className="text-sm font-bold text-gray-800">
                                        📅 {new Date(fechaSeleccionada).toLocaleDateString('es-BO', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {cantidadProductos} productos registrados
                                        {diaActivo && (
                                            <span className="ml-2 text-green-600 text-xs font-semibold">● Activo</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 text-sm">
                                {diaActivo ? (
                                    <button
                                        onClick={handleCerrarDia}
                                        className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-orange-600 text-white hover:bg-orange-700"
                                    >
                                        <span>🔒</span>
                                        Cerrar Día
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleAbrirDia}
                                        disabled={!puedeAbrirDia() || abriendoDia}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${!puedeAbrirDia() || abriendoDia
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        {abriendoDia ? (
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
                                )}
                            </div>
                        </div>

                        <Tabla
                            key={refreshKey}
                            initialStockData={stockData}
                            loading={stockLoading || isLoading}
                            onUpdateStock={handleUpdateStock}
                            diaSeleccionado={diaSeleccionado}
                            productosDisponibles={productos}
                            esPasado={esPasado()}
                            distribuidorId={user?.id}
                            diaActivo={diaActivo}
                        />

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                ❌ {error}
                            </div>
                        )}
                    </>
                )}

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

                {mostrarCalendario && !productosCargados && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Cargando productos...</p>
                    </div>
                )}
            </main>

            {/* ✅ Modal de apertura de día */}
            <ModalAbrirDia
                isOpen={modalAbrir.isOpen}
                onClose={modalAbrir.closeModal}
                onConfirm={confirmarAbrirDia}
                fecha={fechaSeleccionada}
                productosCount={productos.length}
                loading={abriendoDia}
                diaActivo={diaActivo}
                stocks={stocksActuales}
                productos={productos}
            />

            {/* ✅ Modal de cierre de día */}
            <ModalCerrarDia
                isOpen={modalCerrar.isOpen}
                onClose={modalCerrar.closeModal}
                onConfirm={confirmarCerrarDia}
                fecha={fechaSeleccionada}
                resumen={resumenDia}
                loading={cerrandoDia}
            />
        </div>
    );
}