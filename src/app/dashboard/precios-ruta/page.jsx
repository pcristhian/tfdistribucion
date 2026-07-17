// app/dashboard/precios-ruta/page.js
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../../login/hook/useLogin';
import { usePreciosRuta } from './hooks/usePreciosRuta';
import { useRutas } from './hooks/useRutas'; // ✅ Importar hook de rutas
import Header from './components/Header';
import TablaPrecios from './components/TablaPrecios';
import ModalEditarPrecio from './components/ModalEditarPrecio';
import ModalRuta from './components/ModalRuta'; // ✅ Importar modal de ruta

export default function PreciosRutaPage() {
    const { getUser } = useLogin();
    const router = useRouter();
    const user = getUser();

    // ✅ Hooks
    const {
        loading,
        error,
        getRutas,
        getProductosConPrecios,
        guardarPrecio,
        eliminarPrecio,
        reset: resetPrecios
    } = usePreciosRuta();

    const {
        crearRuta,
        loading: loadingRuta,
        reset: resetRuta
    } = useRutas();

    // ✅ Estados
    const [rutas, setRutas] = useState([]);
    const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
    const [productosConPrecios, setProductosConPrecios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModalPrecio, setShowModalPrecio] = useState(false);
    const [showModalRuta, setShowModalRuta] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);
    const [saving, setSaving] = useState(false);

    const isFirstRender = useRef(true);

    // Cargar rutas
    const cargarRutas = useCallback(async () => {
        const data = await getRutas();
        setRutas(data);
        if (data.length > 0 && !rutaSeleccionada) {
            setRutaSeleccionada(data[0].id);
        }
    }, [getRutas, rutaSeleccionada]);

    // Cargar precios de la ruta seleccionada
    const cargarPrecios = useCallback(async (rutaId) => {
        if (!rutaId) return;
        setIsLoading(true);
        const data = await getProductosConPrecios(rutaId);
        setProductosConPrecios(data);
        setIsLoading(false);
    }, [getProductosConPrecios]);

    // Efecto inicial
    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (isFirstRender.current) {
            isFirstRender.current = false;
            cargarRutas();
        }
    }, [user, router, cargarRutas]);

    // Cargar precios cuando cambia la ruta seleccionada
    useEffect(() => {
        if (rutaSeleccionada) {
            cargarPrecios(rutaSeleccionada);
        }
    }, [rutaSeleccionada, cargarPrecios]);

    // ✅ Manejar creación de nueva ruta
    const handleNuevaRuta = () => {
        setShowModalRuta(true);
    };

    // ✅ Guardar nueva ruta
    const handleSaveRuta = async (data) => {
        const result = await crearRuta(data);
        if (result) {
            setShowModalRuta(false);
            await cargarRutas();
            // Seleccionar la nueva ruta
            setRutaSeleccionada(result.id);
            resetRuta();
            alert(`✅ Ruta "${result.nombre}" creada correctamente`);
        }
    };

    // Manejar edición de precio
    const handleEdit = (producto) => {
        setProductoEditando(producto);
        setShowModalPrecio(true);
    };

    // Guardar precio individual
    const handleSavePrecio = async (data) => {
        setSaving(true);
        const result = await guardarPrecio(
            rutaSeleccionada,
            productoEditando.id,
            {
                precio_base: data.precio_base,
                precio_minimo: data.precio_minimo,
                precio_costo: data.precio_costo,
            }
        );
        setSaving(false);

        if (result) {
            setShowModalPrecio(false);
            setProductoEditando(null);
            await cargarPrecios(rutaSeleccionada);
            alert(`✅ Precio actualizado para "${productoEditando.nombre}"`);
        }
    };

    // Eliminar precio personalizado (volver al precio por defecto)
    const handleEliminarPrecio = async (productoId) => {
        if (!confirm('¿Eliminar el precio personalizado para este producto? Volverá al precio por defecto.')) return;

        const result = await eliminarPrecio(rutaSeleccionada, productoId);
        if (result) {
            await cargarPrecios(rutaSeleccionada);
            alert('✅ Precio eliminado, usando precio por defecto');
        }
    };

    if (isLoading && !productosConPrecios.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                titulo="Precios por Ruta"
                onNuevaRuta={handleNuevaRuta} // ✅ Pasar callback
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-black">
                {/* Selector de Ruta */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Seleccionar Ruta
                            </label>
                            <select
                                value={rutaSeleccionada || ''}
                                onChange={(e) => setRutaSeleccionada(e.target.value)}
                                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            >
                                <option value="">Seleccionar ruta...</option>
                                {rutas.map(ruta => (
                                    <option key={ruta.id} value={ruta.id}>
                                        {ruta.nombre} {ruta.ciudad && `- ${ruta.ciudad}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>📊</span>
                            <span>{productosConPrecios.filter(p => p.tiene_precio_personalizado).length} precios personalizados</span>
                        </div>
                    </div>
                    {error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            ❌ {error}
                        </div>
                    )}
                </div>

                {/* Tabla de Precios */}
                <TablaPrecios
                    productos={productosConPrecios}
                    loading={loading || isLoading}
                    onEdit={handleEdit}
                    onEliminar={handleEliminarPrecio}
                    rutaSeleccionada={rutaSeleccionada}
                />
            </main>

            {/* Modal Editar Precio */}
            <ModalEditarPrecio
                isOpen={showModalPrecio}
                onClose={() => {
                    setShowModalPrecio(false);
                    setProductoEditando(null);
                }}
                onSave={handleSavePrecio}
                producto={productoEditando}
                loading={saving}
            />

            {/* ✅ Modal Nueva Ruta */}
            <ModalRuta
                isOpen={showModalRuta}
                onClose={() => {
                    setShowModalRuta(false);
                    resetRuta();
                }}
                onSave={handleSaveRuta}
                loading={loadingRuta}
                modo="crear"
            />
        </div>
    );
}