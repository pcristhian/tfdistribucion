// app/dashboard/nueva-venta/components/Tabla.jsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLogin } from '../../../login/hook/useLogin';
import { useVentasLectura } from '../hooks/useVentasLectura';
import { useCrearVenta } from '../hooks/useCrearVenta';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tabla() {
    const { getUser } = useLogin();
    const user = getUser();

    // ✅ Hooks
    const {
        loading: loadingLectura,
        error: errorLectura,
        getDiaActivo,
        getProductosConStock,
        getClientesPorRuta,
        getRutasDisponibles,
        getPrecioProductoPorRuta, // ✅ Agregamos esta función
        reset: resetLectura
    } = useVentasLectura();

    const {
        loading: loadingCrear,
        error: errorCrear,
        registrarVenta,
        reset: resetCrear
    } = useCrearVenta();

    // ✅ Estados
    const [formData, setFormData] = useState({
        cliente_id: '',
        cliente_nombre: '',
        ruta_id: '',
        observacion: '',
    });
    const [items, setItems] = useState([]);
    const [totales, setTotales] = useState({ subtotal: 0, total: 0 });
    const [rutas, setRutas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [clientesFiltrados, setClientesFiltrados] = useState([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [cargandoRutas, setCargandoRutas] = useState(false);
    const [cargandoDia, setCargandoDia] = useState(true);
    const [diaActivo, setDiaActivo] = useState(null);
    const [stockConfirmado, setStockConfirmado] = useState(false);
    const [multiplesDias, setMultiplesDias] = useState(null);
    const [buscandoClientes, setBuscandoClientes] = useState(false);
    const [preciosCache, setPreciosCache] = useState({}); // ✅ Cache de precios

    const isInitialLoadRef = useRef(true);
    const prevUserIdRef = useRef(null);
    const clienteInputRef = useRef(null);
    const sugerenciasRef = useRef(null);

    // Estado para el formulario de entrada
    const [inputData, setInputData] = useState({
        codigo: '',
        cantidad: 1,
        producto_id: '',
        precio: 0,
        nombre: '',
        stock_actual: 0,
        empresa_color: '#6366f1',
    });

    // ✅ Función para obtener el precio de un producto según la ruta
    const obtenerPrecioProducto = useCallback(async (productoId, rutaId) => {
        if (!productoId) return 0;

        // Verificar si ya tenemos el precio en cache
        const cacheKey = `${productoId}_${rutaId || 'sin_ruta'}`;
        if (preciosCache[cacheKey] !== undefined) {
            return preciosCache[cacheKey];
        }

        // Obtener precio
        const precio = await getPrecioProductoPorRuta(productoId, rutaId);

        // Guardar en cache
        setPreciosCache(prev => ({
            ...prev,
            [cacheKey]: precio
        }));

        return precio;
    }, [getPrecioProductoPorRuta, preciosCache]);

    // ✅ Cuando cambia la ruta, actualizar precios de los productos en el carrito
    useEffect(() => {
        const actualizarPreciosCarrito = async () => {
            if (items.length === 0) return;

            const nuevosItems = await Promise.all(items.map(async (item) => {
                const nuevoPrecio = await obtenerPrecioProducto(item.producto_id, formData.ruta_id);
                return {
                    ...item,
                    precio_unitario: nuevoPrecio,
                    subtotal: nuevoPrecio * item.cantidad
                };
            }));

            setItems(nuevosItems);

            // Recalcular totales
            const totalGeneral = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
            setTotales({ subtotal: totalGeneral, total: totalGeneral });
        };

        actualizarPreciosCarrito();
    }, [formData.ruta_id, obtenerPrecioProducto]);

    // ✅ Cargar el día activo
    useEffect(() => {
        if (user?.id && (isInitialLoadRef.current || prevUserIdRef.current !== user.id)) {
            const cargarDiaActivo = async () => {
                setCargandoDia(true);
                try {
                    const dia = await getDiaActivo(user.id);
                    if (dia) {
                        setDiaActivo(dia);
                        const data = await getProductosConStock(user.id);
                        if (data && !data.error) {
                            setProductosDisponibles(data.productos || []);
                        } else if (data?.error === 'multiples_dias_activos') {
                            setMultiplesDias(data);
                            setProductosDisponibles([]);
                        }
                    } else {
                        setDiaActivo(null);
                        setProductosDisponibles([]);
                    }
                } catch (error) {
                    console.error('Error al cargar día activo:', error);
                } finally {
                    setCargandoDia(false);
                    isInitialLoadRef.current = false;
                    prevUserIdRef.current = user.id;
                }
            };
            cargarDiaActivo();
        }
    }, [user?.id, getDiaActivo, getProductosConStock]);

    // ✅ Obtener rutas
    useEffect(() => {
        if (user?.id) {
            setCargandoRutas(true);
            getRutasDisponibles(user.id).then(rutasData => {
                setRutas(rutasData || []);
                setCargandoRutas(false);
                if (rutasData && rutasData.length === 1) {
                    setFormData(prev => ({ ...prev, ruta_id: rutasData[0].id }));
                }
            });
        }
    }, [user?.id, getRutasDisponibles]);

    // ✅ Cargar clientes al seleccionar ruta
    const handleRutaChange = async (e) => {
        const rutaId = e.target.value;
        setFormData(prev => ({ ...prev, ruta_id: rutaId, cliente_id: '', cliente_nombre: '' }));
        setClientesFiltrados([]);
        setMostrarSugerencias(false);

        if (rutaId) {
            setBuscandoClientes(true);
            const clientesData = await getClientesPorRuta(rutaId);
            setClientes(clientesData || []);
            setClientesFiltrados(clientesData || []);
            setBuscandoClientes(false);
        } else {
            setClientes([]);
            setClientesFiltrados([]);
        }

        // ✅ Si hay un producto seleccionado, actualizar su precio
        if (inputData.producto_id) {
            const nuevoPrecio = await obtenerPrecioProducto(inputData.producto_id, rutaId);
            setInputData(prev => ({
                ...prev,
                precio: nuevoPrecio
            }));
        }
    };

    // ✅ Buscar clientes en tiempo real
    const buscarClientes = useCallback((termino) => {
        const nombreCliente = termino.toLowerCase().trim();
        setFormData(prev => ({ ...prev, cliente_nombre: termino, cliente_id: '' }));
        setMostrarSugerencias(true);

        if (!nombreCliente) {
            setClientesFiltrados(clientes);
            return;
        }

        const filtrados = clientes.filter(cliente =>
            cliente.nombre?.toLowerCase().includes(nombreCliente) ||
            cliente.telefono?.includes(termino) ||
            cliente.direccion?.toLowerCase().includes(nombreCliente)
        );
        setClientesFiltrados(filtrados);
    }, [clientes]);

    // ✅ Seleccionar un cliente de la lista
    const seleccionarCliente = useCallback((cliente) => {
        setFormData(prev => ({
            ...prev,
            cliente_id: cliente.id,
            cliente_nombre: cliente.nombre,
        }));
        setClientesFiltrados([]);
        setMostrarSugerencias(false);
        if (clienteInputRef.current) {
            clienteInputRef.current.focus();
        }
    }, []);

    // ✅ Cerrar sugerencias al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sugerenciasRef.current && !sugerenciasRef.current.contains(event.target) &&
                clienteInputRef.current && !clienteInputRef.current.contains(event.target)) {
                setMostrarSugerencias(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ✅ Buscar producto por código
    const buscarProducto = useCallback(async (codigo) => {
        if (!codigo || codigo.trim().length < 2) {
            setInputData(prev => ({
                ...prev,
                producto_id: '',
                precio: 0,
                nombre: '',
                stock_actual: 0,
                empresa_color: '#6366f1',
            }));
            return null;
        }

        const producto = productosDisponibles.find(p =>
            p.codigo?.toLowerCase().includes(codigo.toLowerCase()) ||
            p.nombre?.toLowerCase().includes(codigo.toLowerCase())
        );

        if (producto) {
            const stockActual = producto.stock_actual || 0;

            // ✅ Obtener precio según la ruta seleccionada
            const precio = await obtenerPrecioProducto(producto.producto_id, formData.ruta_id);

            setInputData(prev => ({
                ...prev,
                producto_id: producto.producto_id,
                precio: precio,
                nombre: producto.nombre,
                stock_actual: stockActual,
                empresa_color: producto.empresa?.color_primario || producto.empresa_color || '#6366f1',
            }));
            return producto;
        } else {
            setInputData(prev => ({
                ...prev,
                producto_id: '',
                precio: 0,
                nombre: '',
                stock_actual: 0,
                empresa_color: '#6366f1',
            }));
            return null;
        }
    }, [productosDisponibles, formData.ruta_id, obtenerPrecioProducto]);

    // ✅ Manejar cambio de código
    const handleCodigoChange = (e) => {
        const codigo = e.target.value.toUpperCase();
        setInputData(prev => ({ ...prev, codigo }));

        if (codigo.length >= 2) {
            buscarProducto(codigo);
        } else {
            setInputData(prev => ({
                ...prev,
                producto_id: '',
                precio: 0,
                nombre: '',
                stock_actual: 0,
                empresa_color: '#6366f1',
            }));
        }
    };

    // ✅ Agregar item a la venta
    const agregarItem = useCallback(() => {
        if (!inputData.codigo.trim()) {
            alert('Ingresa un código de producto');
            return;
        }

        if (!inputData.producto_id) {
            alert('Producto no encontrado');
            return;
        }

        if (inputData.cantidad <= 0) {
            alert('La cantidad debe ser mayor a 0');
            return;
        }

        if (inputData.cantidad > inputData.stock_actual) {
            alert(`Stock insuficiente. Disponible: ${inputData.stock_actual}`);
            return;
        }

        const precioUnitario = inputData.precio || 0;
        const subtotal = precioUnitario * inputData.cantidad;

        const nuevoItem = {
            id: Date.now(),
            producto_id: inputData.producto_id,
            codigo: inputData.codigo,
            nombre: inputData.nombre || 'Producto',
            cantidad: inputData.cantidad,
            precio_unitario: precioUnitario,
            subtotal: subtotal,
            empresa_color: inputData.empresa_color || '#6366f1',
            stock_disponible: inputData.stock_actual,
            ruta_id: formData.ruta_id || null, // ✅ Guardamos la ruta del item
        };

        const nuevosItems = [...items, nuevoItem];
        setItems(nuevosItems);

        const totalGeneral = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
        setTotales({ subtotal: totalGeneral, total: totalGeneral });

        setInputData({
            codigo: '',
            cantidad: 1,
            producto_id: '',
            precio: 0,
            nombre: '',
            stock_actual: 0,
            empresa_color: '#6366f1',
        });

        setTimeout(() => {
            const input = document.getElementById('codigo-input');
            if (input) input.focus();
        }, 100);
    }, [inputData, items, formData.ruta_id]);

    // ✅ Eliminar item
    const eliminarItem = (id) => {
        const nuevosItems = items.filter(item => item.id !== id);
        setItems(nuevosItems);
        const totalGeneral = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
        setTotales({ subtotal: totalGeneral, total: totalGeneral });
    };

    // ✅ Confirmar stock y continuar
    const confirmarStock = () => {
        if (productosDisponibles.length === 0) {
            alert('⚠️ No hay productos con stock disponible para hoy');
            return;
        }
        setStockConfirmado(true);
    };

    // ✅ Guardar venta
    const guardarVenta = async () => {
        if (items.length === 0) {
            alert('Agrega al menos un producto');
            return;
        }

        try {
            let ventasRegistradas = 0;

            let clienteNombre = formData.cliente_nombre || 'Cliente Mostrador';
            let clienteId = formData.cliente_id || null;

            for (const item of items) {
                const ventaData = {
                    distribuidor_id: user.id,
                    cliente_id: clienteId,
                    ruta_id: formData.ruta_id || null,
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    stock_disponible: item.stock_disponible,
                    observacion: formData.observacion || '',
                    cliente_nombre: clienteNombre,
                };

                const result = await registrarVenta(ventaData);
                if (!result) {
                    alert(`Error al registrar ${item.nombre}`);
                    return;
                }
                ventasRegistradas++;
            }

            alert(`✅ ${ventasRegistradas} venta(s) registrada(s) exitosamente`);

            setItems([]);
            setTotales({ subtotal: 0, total: 0 });
            setFormData(prev => ({ ...prev, cliente_id: '', cliente_nombre: '', observacion: '' }));
            setClientesFiltrados([]);
            setMostrarSugerencias(false);

            const data = await getProductosConStock(user.id);
            if (data && !data.error) {
                setProductosDisponibles(data.productos || []);
            }

        } catch (error) {
            console.error('Error al guardar venta:', error);
            alert('❌ Error al registrar la venta: ' + error.message);
        }
    };

    // ✅ Si hay múltiples días activos
    if (multiplesDias) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-red-600">Múltiples días activos</h3>
                <p className="text-gray-600 text-sm mt-2">
                    {multiplesDias.mensaje}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                    Solo debe haber un día activo. Contacta al administrador.
                </p>
                <button
                    onClick={() => window.location.href = '/dashboard/mi-stock-hoy'}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Ir a Mi Stock Hoy
                </button>
            </div>
        );
    }

    // ✅ Si no hay día activo
    if (!cargandoDia && !diaActivo) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-lg font-semibold text-gray-800">No hay un día activo</h3>
                <p className="text-gray-500 text-sm mt-1">
                    Ve al módulo "Mi Stock Hoy" y abre un día para comenzar a vender
                </p>
                <button
                    onClick={() => window.location.href = '/dashboard/mi-stock-hoy'}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Ir a Mi Stock Hoy
                </button>
            </div>
        );
    }

    if (loadingLectura || cargandoRutas || cargandoDia) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // ✅ Mostrar tabla de stock si no está confirmado
    if (!stockConfirmado) {
        const productosConStock = productosDisponibles.filter(p => (p.stock_actual || 0) > 0);

        return (
            <div className="space-y-4 text-black">
                {/* Header con información del día activo */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📅</span>
                            <h3 className="text-sm font-semibold text-gray-700">
                                {diaActivo ? (() => {
                                    // ✅ Crear fecha asegurando que se interprete correctamente
                                    const partes = diaActivo.fecha.split('-');
                                    const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
                                    return fecha.toLocaleDateString('es-BO', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    });
                                })() : 'Sin día activo'}
                            </h3>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                ● Activo
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                {productosDisponibles.length} productos
                            </span>
                        </div>
                    </div>
                    {diaActivo && diaActivo.datos?.resumen && (
                        <div className="mt-2 text-xs text-gray-500">
                            Total productos: {diaActivo.datos.resumen.total_productos || 0} |
                            Stock total: {diaActivo.datos.resumen.stock_actual_total || 0} |
                            Vendido: {diaActivo.datos.resumen.total_vendido || 0}
                        </div>
                    )}
                </div>

                {/* Tabla de Stock */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">
                                        Stock Actual
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 tracking-wider">
                                        Código
                                    </th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 tracking-wider">
                                        Precio
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                <AnimatePresence>
                                    {productosDisponibles.map((item, index) => {
                                        const stockActual = item.stock_actual || 0;
                                        const tieneStock = stockActual > 0;
                                        const precio = item.precio_venta || item.precio_base || 0;

                                        return (
                                            <motion.tr
                                                key={item.producto_id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className={`hover:bg-gray-50 transition-colors ${tieneStock ? 'bg-green-50/20' : 'bg-red-50/20'}`}
                                            >
                                                <td className="px-4 py-2 text-center">
                                                    <span className={`font-bold ${tieneStock ? 'text-green-600' : 'text-red-500'}`}>
                                                        {stockActual}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 font-mono text-xs font-medium text-gray-700">
                                                    {item.codigo || '-'}
                                                </td>
                                                {/* <td className="px-4 py-2 text-sm text-gray-800">
                                                    <div className="flex items-center gap-2">
                                                        {item.empresa?.color_primario && (
                                                            <span
                                                                className="inline-block w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: item.empresa.color_primario }}
                                                            />
                                                        )}
                                                        {item.nombre || '-'}
                                                    </div>
                                                </td> */}
                                                <td className="px-4 py-2 text-center font-medium text-blue-600">
                                                    Bs. {precio.toFixed(2)}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                <tr>
                                    <td colSpan="4" className="px-4 py-3 text-sm text-gray-500">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <span>📦 Total productos: <strong className="text-gray-700">{productosDisponibles.length}</strong></span>
                                            <span>📦 Con stock: <strong className="text-green-600">{productosConStock.length}</strong></span>
                                            <span>⚠️ Sin stock: <strong className="text-red-500">{productosDisponibles.length - productosConStock.length}</strong></span>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Botón Seguir */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-600 text-center mb-3">
                        📋 Revisa que los stocks sean correctos antes de continuar
                    </p>
                    <button
                        onClick={confirmarStock}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>✅</span>
                        Seguir con Ventas
                    </button>
                </div>
            </div>
        );
    }

    // ✅ VISTA DE VENTAS (después de confirmar stock)
    return (
        <div className="space-y-4 text-black">
            {/* Header con información del día activo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <h3 className="text-sm font-semibold text-gray-700">
                            {diaActivo ? new Date(diaActivo.fecha).toLocaleDateString('es-BO', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            }) : 'Sin día activo'}
                        </h3>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            ● Activo
                        </span>
                    </div>
                    <button
                        onClick={() => setStockConfirmado(false)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                        ← Ver Stock
                    </button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                    {productosDisponibles.length} productos con stock
                </div>
            </div>

            {/* Selección de Ruta y Cliente con búsqueda */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ruta <span className="text-xs text-gray-400">(opcional)</span>
                        </label>
                        <select
                            value={formData.ruta_id}
                            onChange={handleRutaChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Sin ruta</option>
                            {rutas.map(ruta => (
                                <option key={ruta.id} value={ruta.id}>
                                    {ruta.nombre} {ruta.ciudad ? `- ${ruta.ciudad}` : ''}
                                </option>
                            ))}
                        </select>
                        {formData.ruta_id && (
                            <p className="text-xs text-blue-600 mt-1">
                                💰 Precios actualizados según ruta seleccionada
                            </p>
                        )}
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cliente <span className="text-xs text-gray-400">(opcional - buscar por nombre)</span>
                        </label>
                        <div className="relative">
                            <input
                                ref={clienteInputRef}
                                type="text"
                                value={formData.cliente_nombre}
                                onChange={(e) => buscarClientes(e.target.value)}
                                onFocus={() => {
                                    if (clientes.length > 0) {
                                        setMostrarSugerencias(true);
                                        setClientesFiltrados(clientes);
                                    }
                                }}
                                placeholder="Buscar cliente por nombre..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            {buscandoClientes && (
                                <div className="absolute right-3 top-2.5">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                </div>
                            )}
                        </div>

                        {/* Sugerencias de clientes */}
                        {mostrarSugerencias && clientesFiltrados.length > 0 && (
                            <div
                                ref={sugerenciasRef}
                                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                            >
                                {clientesFiltrados.map((cliente) => (
                                    <button
                                        key={cliente.id}
                                        onClick={() => seleccionarCliente(cliente)}
                                        className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                                    >
                                        <div className="font-medium text-gray-800">{cliente.nombre}</div>
                                        <div className="text-xs text-gray-500">
                                            {cliente.telefono && <span>📱 {cliente.telefono}</span>}
                                            {cliente.direccion && <span className="ml-2">📍 {cliente.direccion}</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Mensaje cuando no hay clientes */}
                        {mostrarSugerencias && formData.cliente_nombre && clientesFiltrados.length === 0 && !buscandoClientes && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
                                <p className="text-sm text-gray-500">No se encontraron clientes</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formData.ruta_id ? 'Prueba con otro término o selecciona otra ruta' : 'Selecciona una ruta para ver sus clientes'}
                                </p>
                            </div>
                        )}

                        {/* Cliente seleccionado */}
                        {formData.cliente_id && (
                            <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                ✅ Cliente seleccionado: <strong>{formData.cliente_nombre}</strong>
                            </div>
                        )}
                        {!formData.cliente_id && formData.cliente_nombre && (
                            <div className="mt-1 text-xs text-gray-400">
                                💡 Cliente no seleccionado - Se registrará como "Cliente Mostrador"
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Formulario de entrada de productos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Código</label>
                        <input
                            id="codigo-input"
                            type="text"
                            value={inputData.codigo}
                            onChange={handleCodigoChange}
                            placeholder="Ej: ENTEL10, TIGO20..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm uppercase"
                            autoFocus
                        />
                        {inputData.nombre && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <span
                                    className="inline-block w-2 h-2 rounded-full"
                                    style={{ backgroundColor: inputData.empresa_color }}
                                />
                                ✅ {inputData.nombre} (Stock: {inputData.stock_actual})
                                {formData.ruta_id ? (
                                    <span className="text-blue-600 ml-1">
                                        - Precio ruta: Bs. {inputData.precio.toFixed(2)}
                                    </span>
                                ) : (
                                    <span className="text-gray-500 ml-1">
                                        - Precio base: Bs. {inputData.precio.toFixed(2)}
                                    </span>
                                )}
                            </p>
                        )}
                        {inputData.codigo.length >= 2 && !inputData.producto_id && (
                            <p className="text-xs text-red-500 mt-1">❌ Producto no encontrado</p>
                        )}
                    </div>
                    <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-1">Cant.</label>
                        <input
                            type="number"
                            value={inputData.cantidad}
                            onChange={(e) => setInputData(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div className="w-32 flex items-end">
                        <button
                            onClick={agregarItem}
                            disabled={!inputData.producto_id || inputData.cantidad <= 0}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            + Agregar
                        </button>
                    </div>
                </div>
                {inputData.producto_id && inputData.stock_actual === 0 && (
                    <p className="text-xs text-red-500 mt-2">⚠️ Sin stock disponible para este producto</p>
                )}
                {errorLectura && (
                    <p className="text-xs text-red-500 mt-2">❌ {errorLectura}</p>
                )}
                {errorCrear && (
                    <p className="text-xs text-red-500 mt-2">❌ {errorCrear}</p>
                )}
            </div>

            {/* Lista de productos agregados con subtotales */}
            {items.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">
                            📋 Productos Agregados ({items.length})
                        </h3>
                        <span className="text-xs text-gray-500">
                            Stock disponible al momento de agregar
                        </span>
                    </div>
                    <AnimatePresence>
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="inline-block w-2 h-2 rounded-full"
                                                style={{ backgroundColor: item.empresa_color || '#6366f1' }}
                                            />
                                            <span className="font-mono text-xs text-gray-500">
                                                {item.codigo}
                                            </span>
                                            <span className="font-medium text-gray-800">
                                                {item.nombre}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                x{item.cantidad}
                                            </span>
                                            <span className="text-xs text-gray-400 ml-1">
                                                (Stock: {item.stock_disponible})
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Bs. {item.precio_unitario.toFixed(2)} c/u
                                            {item.ruta_id && <span className="text-blue-600 ml-1">(Precio ruta)</span>}
                                            {!item.ruta_id && <span className="text-gray-400 ml-1">(Precio base)</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">Subtotal</div>
                                            <span className="font-semibold text-blue-600">
                                                Bs. {item.subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => eliminarItem(item.id)}
                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total de la venta:</span>
                            <span className="text-lg font-bold text-blue-600">
                                Bs. {totales.total.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                            <span>Items: {items.length}</span>
                            <span>Total unidades: {items.reduce((sum, item) => sum + item.cantidad, 0)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Observación y Botón Guardar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observación <span className="text-xs text-gray-400">(opcional)</span>
                    </label>
                    <input
                        type="text"
                        value={formData.observacion}
                        onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                        placeholder="Nota adicional (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <button
                    onClick={guardarVenta}
                    disabled={loadingCrear || items.length === 0}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loadingCrear ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Procesando...
                        </>
                    ) : (
                        '✅ Registrar Venta'
                    )}
                </button>
                {items.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-2 text-center">⚠️ Agrega al menos un producto para registrar la venta</p>
                )}
            </div>
        </div>
    );
}