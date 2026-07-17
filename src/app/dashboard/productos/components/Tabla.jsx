'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function Tabla({
    productos = [],
    loading = false,
    onEdit,
    onToggleActivo
}) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActivo, setFilterActivo] = useState('todos');

    // ✅ Estado para precios por ruta
    const [rutas, setRutas] = useState([]);
    const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
    const [preciosRuta, setPreciosRuta] = useState({});
    const [cargandoPrecios, setCargandoPrecios] = useState(false);

    // ✅ Cargar rutas al montar
    useEffect(() => {
        const cargarRutas = async () => {
            try {
                const { data, error } = await supabase
                    .from('rutas')
                    .select('id, nombre, ciudad')
                    .eq('activo', true)
                    .order('nombre', { ascending: true });

                if (error) throw error;
                setRutas(data || []);
                if (data && data.length > 0) {
                    setRutaSeleccionada(data[0].id);
                }
            } catch (error) {
                console.error('Error al cargar rutas:', error);
            }
        };
        cargarRutas();
    }, []);

    // ✅ Cargar precios de la ruta seleccionada
    useEffect(() => {
        const cargarPrecios = async () => {
            if (!rutaSeleccionada) return;

            setCargandoPrecios(true);
            try {
                const { data, error } = await supabase
                    .from('precios_ruta')
                    .select('producto_id, precio_base, precio_minimo, precio_costo')
                    .eq('ruta_id', rutaSeleccionada);

                if (error) throw error;

                // Convertir a objeto para acceso rápido
                const preciosMap = {};
                data.forEach(item => {
                    preciosMap[item.producto_id] = {
                        precio_base: item.precio_base,
                        precio_minimo: item.precio_minimo,
                        precio_costo: item.precio_costo,
                    };
                });
                setPreciosRuta(preciosMap);
            } catch (error) {
                console.error('Error al cargar precios:', error);
            } finally {
                setCargandoPrecios(false);
            }
        };

        cargarPrecios();
    }, [rutaSeleccionada]);

    // ✅ Función para extraer número del código (para ordenamiento numérico)
    const extraerNumero = (codigo) => {
        if (!codigo) return 0;
        const match = codigo.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
    };

    // ✅ Función para determinar si es un chip (por categoría y nombre)
    const esChip = (producto) => {
        const nombreCategoria = producto.categoria?.nombre?.toLowerCase() || '';
        const nombreProducto = producto.nombre?.toLowerCase() || '';

        if (nombreCategoria.includes('chip') || nombreCategoria.includes('recarga')) {
            return true;
        }

        return nombreProducto.includes('chip') ||
            (nombreProducto.includes('recarga') && nombreProducto.includes('chip'));
    };

    // ✅ Función para ordenar productos
    const ordenarProductos = (productosArray) => {
        const ordenEmpresas = {
            'Entel': 1,
            'Viva': 2,
            'Tigo': 3,
        };

        const ordenCategorias = {
            'Tarjeta': 1,
            'Recarga': 2,
            'Chip': 3,
            'Paquete': 4,
            'Otro': 5,
        };

        const tarjetas = [];
        const chips = [];

        productosArray.forEach(producto => {
            if (esChip(producto)) {
                chips.push(producto);
            } else {
                tarjetas.push(producto);
            }
        });

        const tarjetasOrdenadas = tarjetas.sort((a, b) => {
            const empresaA = a.empresa?.nombre || '';
            const empresaB = b.empresa?.nombre || '';
            const ordenA = ordenEmpresas[empresaA] || 999;
            const ordenB = ordenEmpresas[empresaB] || 999;
            if (ordenA !== ordenB) return ordenA - ordenB;

            const catA = a.categoria?.nombre || '';
            const catB = b.categoria?.nombre || '';
            const ordenCatA = ordenCategorias[catA] || 999;
            const ordenCatB = ordenCategorias[catB] || 999;
            if (ordenCatA !== ordenCatB) return ordenCatA - ordenCatB;

            const numA = extraerNumero(a.codigo);
            const numB = extraerNumero(b.codigo);
            if (numA !== numB) return numA - numB;

            return (a.codigo || '').localeCompare(b.codigo || '');
        });

        const chipsOrdenadas = chips.sort((a, b) => {
            const empresaA = a.empresa?.nombre || '';
            const empresaB = b.empresa?.nombre || '';
            const ordenA = ordenEmpresas[empresaA] || 999;
            const ordenB = ordenEmpresas[empresaB] || 999;
            if (ordenA !== ordenB) return ordenA - ordenB;

            const catA = a.categoria?.nombre || '';
            const catB = b.categoria?.nombre || '';
            const ordenCatA = ordenCategorias[catA] || 999;
            const ordenCatB = ordenCategorias[catB] || 999;
            if (ordenCatA !== ordenCatB) return ordenCatA - ordenCatB;

            const numA = extraerNumero(a.codigo);
            const numB = extraerNumero(b.codigo);
            if (numA !== numB) return numA - numB;

            return (a.codigo || '').localeCompare(b.codigo || '');
        });

        return [...tarjetasOrdenadas, ...chipsOrdenadas];
    };

    // ✅ Obtener precio del producto (priorizar precio de ruta)
    const getPrecioProducto = (producto) => {
        const precioRuta = preciosRuta[producto.id];
        if (precioRuta && rutaSeleccionada) {
            return {
                precio_base: precioRuta.precio_base,
                precio_minimo: precioRuta.precio_minimo,
                precio_costo: precioRuta.precio_costo,
                es_personalizado: true
            };
        }
        return {
            precio_base: producto.precio_base,
            precio_minimo: producto.precio_minimo,
            precio_costo: producto.precio_costo,
            es_personalizado: false
        };
    };

    // Filtrar productos
    const filteredProductos = productos.filter(producto => {
        const term = searchTerm.toLowerCase();
        const matchSearch =
            producto.nombre.toLowerCase().includes(term) ||
            (producto.codigo && producto.codigo.toLowerCase().includes(term)) ||
            (producto.empresa?.nombre && producto.empresa.nombre.toLowerCase().includes(term)) ||
            (producto.categoria?.nombre && producto.categoria.nombre.toLowerCase().includes(term));

        let matchEstado = true;
        if (filterActivo === 'activos') {
            matchEstado = producto.activo === true;
        } else if (filterActivo === 'inactivos') {
            matchEstado = producto.activo === false;
        }

        return matchSearch && matchEstado;
    });

    const productosOrdenados = ordenarProductos(filteredProductos);

    const formatPrice = (value) => {
        if (value === null || value === undefined) return '-';
        return `Bs. ${parseFloat(value).toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Barra de filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="space-y-3">
                    {/* ✅ Selector de Ruta para precios */}
                    {rutas.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <div className="flex-1 w-full sm:w-auto">
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    🗺️ Precios para ruta
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
                            {cargandoPrecios && (
                                <div className="flex items-center text-sm text-gray-400">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                                    Cargando precios...
                                </div>
                            )}
                            {rutaSeleccionada && !cargandoPrecios && (
                                <div className="flex items-center text-sm text-green-600">
                                    ✅ Mostrando precios de: {rutas.find(r => r.id === rutaSeleccionada)?.nombre}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="🔍 Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <button
                            onClick={() => setFilterActivo('todos')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filterActivo === 'todos'
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Todos ({productos.length})
                        </button>
                        <button
                            onClick={() => setFilterActivo('activos')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filterActivo === 'activos'
                                ? 'bg-green-600 text-white'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                        >
                            ✅ Activos
                        </button>
                        <button
                            onClick={() => setFilterActivo('inactivos')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filterActivo === 'inactivos'
                                ? 'bg-red-600 text-white'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                        >
                            ⛔ Inactivos
                        </button>
                    </div>
                </div>
            </div>

            {/* Resultados */}
            {productosOrdenados.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold text-gray-800">No hay productos</h3>
                    <p className="text-gray-500 text-sm mt-1">
                        {searchTerm || filterActivo !== 'todos'
                            ? 'No coinciden con los filtros aplicados'
                            : 'Comienza creando tu primer producto'}
                    </p>
                    {(searchTerm || filterActivo !== 'todos') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterActivo('todos');
                            }}
                            className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <AnimatePresence>
                    <div className="space-y-3">
                        {(() => {
                            let empresaActual = '';
                            let categoriaActual = '';
                            let esSeccionChips = false;
                            const items = [];

                            productosOrdenados.forEach((producto, index) => {
                                const empresa = producto.empresa?.nombre || 'Sin empresa';
                                const categoria = producto.categoria?.nombre || 'Sin categoría';
                                const esChipProducto = esChip(producto);
                                const precio = getPrecioProducto(producto);
                                const tienePrecioPersonalizado = precio.es_personalizado && rutaSeleccionada;

                                const nuevaSeccionChips = esChipProducto;
                                const cambioSeccion = esSeccionChips !== nuevaSeccionChips;
                                esSeccionChips = nuevaSeccionChips;

                                const cambioEmpresa = empresa !== empresaActual;
                                empresaActual = empresa;

                                const cambioCategoria = categoria !== categoriaActual;
                                categoriaActual = categoria;

                                if (index === 0) {
                                    items.push(
                                        <div key="separador-inicio" className="flex items-center gap-2 py-2">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                {esChipProducto ? '📱 Chips' : '💳 Tarjetas'}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-200"></div>
                                        </div>
                                    );
                                } else if (cambioSeccion) {
                                    items.push(
                                        <div key={`separador-${index}`} className="flex items-center gap-2 py-2 mt-2">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                {esChipProducto ? '📱 Chips' : '💳 Tarjetas'}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-200"></div>
                                        </div>
                                    );
                                }

                                if (cambioEmpresa && index > 0 && !cambioSeccion) {
                                    items.push(
                                        <div key={`empresa-${index}`} className="flex items-center gap-2 py-1">
                                            <span className="text-[10px] font-medium text-gray-400">
                                                {empresa}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-100"></div>
                                        </div>
                                    );
                                }

                                if (cambioCategoria && index > 0 && !cambioEmpresa && !cambioSeccion) {
                                    items.push(
                                        <div key={`categoria-${index}`} className="flex items-center gap-2 py-1 pl-4">
                                            <span className="text-[9px] text-gray-300">
                                                {categoria}
                                            </span>
                                        </div>
                                    );
                                }

                                items.push(
                                    <motion.div
                                        key={producto.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${esChipProducto
                                                ? 'border-purple-200 bg-purple-50/20'
                                                : 'border-gray-100'
                                            }`}
                                    >
                                        <div className="p-4">
                                            {/* Header: Código + Estado + Tipo */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{
                                                            backgroundColor: producto.empresa?.color_primario || '#6366f1'
                                                        }}
                                                    />
                                                    <span className="font-mono text-xs text-gray-500">
                                                        {producto.codigo || 'Sin código'}
                                                    </span>
                                                    {esChipProducto && (
                                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                            📱 Chip
                                                        </span>
                                                    )}
                                                    {producto.categoria?.nombre && (
                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                            {producto.categoria.nombre}
                                                        </span>
                                                    )}
                                                    {tienePrecioPersonalizado && (
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                            💰 Personalizado
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${producto.activo
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {producto.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>

                                            {/* Nombre del producto */}
                                            <h3 className="text-base font-bold text-gray-800 mb-1">
                                                {producto.nombre}
                                            </h3>

                                            {/* Descripción */}
                                            {producto.descripcion && (
                                                <p className="text-xs text-gray-400 mb-3">
                                                    {producto.descripcion}
                                                </p>
                                            )}

                                            {/* ✅ Grid de información con precios por ruta */}
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <p className="text-[10px] text-gray-400 uppercase">Empresa</p>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {producto.empresa?.nombre || '-'}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <p className="text-[10px] text-gray-400 uppercase">Categoría</p>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {producto.categoria?.nombre || '-'}
                                                    </p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <p className="text-[10px] text-gray-400 uppercase">Precio Base</p>
                                                    <p className={`text-sm font-bold ${tienePrecioPersonalizado ? 'text-blue-600' : 'text-gray-700'}`}>
                                                        {formatPrice(precio.precio_base)}
                                                    </p>
                                                    {tienePrecioPersonalizado && (
                                                        <p className="text-[8px] text-gray-400 line-through">
                                                            {formatPrice(producto.precio_base)}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-2">
                                                    <p className="text-[10px] text-gray-400 uppercase">Precio Costo</p>
                                                    <p className={`text-sm ${tienePrecioPersonalizado ? 'text-blue-600' : 'text-gray-700'}`}>
                                                        {formatPrice(precio.precio_costo)}
                                                    </p>
                                                    {tienePrecioPersonalizado && (
                                                        <p className="text-[8px] text-gray-400 line-through">
                                                            {formatPrice(producto.precio_costo)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={() => onEdit?.(producto)}
                                                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    ✏️ Editar
                                                </button>
                                                <button
                                                    onClick={() => onToggleActivo?.(producto)}
                                                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${producto.activo
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                        }`}
                                                >
                                                    {producto.activo ? '🔴 Desactivar' : '🟢 Activar'}
                                                </button>
                                            </div>

                                            {/* ✅ Indicador de ruta con precio personalizado */}
                                            {tienePrecioPersonalizado && rutaSeleccionada && (
                                                <div className="mt-2 text-[10px] text-green-600 bg-green-50 rounded-lg px-2 py-1 flex items-center gap-1">
                                                    <span>💰</span>
                                                    Precio para {rutas.find(r => r.id === rutaSeleccionada)?.nombre}
                                                </div>
                                            )}
                                            {!tienePrecioPersonalizado && rutaSeleccionada && (
                                                <div className="mt-2 text-[10px] text-gray-400 bg-gray-50 rounded-lg px-2 py-1">
                                                    📋 Usando precio por defecto
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            });

                            return items;
                        })()}
                    </div>
                </AnimatePresence>
            )}

            {/* Contador */}
            {productosOrdenados.length > 0 && (
                <div className="text-center text-xs text-gray-400 py-2">
                    Mostrando {productosOrdenados.length} de {productos.length} productos
                    {rutaSeleccionada && (
                        <span className="ml-2 text-green-600">
                            • Precios de: {rutas.find(r => r.id === rutaSeleccionada)?.nombre}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}