// src/app/dashboard/nueva-venta/components/Tabla.jsx
'use client';

import { useState, useEffect } from 'react';
import { useVentas } from '../hooks/useVentas';
import { useLogin } from '../../../login/hook/useLogin';
import { supabase } from '@/lib/supabase';

export default function Tabla() {
    const { getUser } = useLogin();
    const user = getUser();
    const {
        clientes,
        loading,
        getClientesPorRuta,
        getRutasDistribuidor,
        crearVenta,
        crearDetallesVenta,
        calcularTotales,
    } = useVentas();

    const [formData, setFormData] = useState({
        cliente_id: '',
        ruta_id: '',
        metodo_pago: 'efectivo',
        observacion: '',
    });

    const [items, setItems] = useState([]);
    const [totales, setTotales] = useState({ subtotal: 0, total: 0 });
    const [rutas, setRutas] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [productos, setProductos] = useState([]);

    // Estado para el formulario de entrada
    const [inputData, setInputData] = useState({
        empresa: 'Entel',
        codigo: '',
        cantidad: 1,
        precio: 0,
        producto_id: '',
    });

    // Obtener empresas y productos
    useEffect(() => {
        const fetchData = async () => {
            // Obtener empresas
            const { data: empresasData } = await supabase
                .from('empresas')
                .select('*')
                .eq('activo', true)
                .order('nombre');

            if (empresasData) {
                // Ordenar: Entel primero, luego los demás
                const sorted = empresasData.sort((a, b) => {
                    if (a.nombre === 'Entel') return -1;
                    if (b.nombre === 'Entel') return 1;
                    return a.nombre.localeCompare(b.nombre);
                });
                setEmpresas(sorted);
            }

            // Obtener productos
            const { data: productosData } = await supabase
                .from('productos')
                .select('*')
                .eq('activo', true)
                .order('nombre');

            if (productosData) setProductos(productosData);
        };

        fetchData();
    }, []);

    // Obtener rutas del distribuidor
    useEffect(() => {
        if (user?.id) {
            getRutasDistribuidor(user.id).then(rutas => {
                setRutas(rutas);
            });
        }
    }, [user]);

    // Cargar clientes al seleccionar ruta
    const handleRutaChange = async (e) => {
        const rutaId = e.target.value;
        setFormData({ ...formData, ruta_id: rutaId });
        if (rutaId) {
            await getClientesPorRuta(rutaId);
        }
    };

    // Buscar producto por código
    const buscarProducto = (codigo) => {
        if (!codigo.trim()) return null;

        // Buscar por código exacto o parcial
        const producto = productos.find(p =>
            p.codigo?.toLowerCase().includes(codigo.toLowerCase()) ||
            p.nombre?.toLowerCase().includes(codigo.toLowerCase())
        );

        if (producto) {
            setInputData({
                ...inputData,
                producto_id: producto.id,
                precio: producto.precio_base || 0,
                empresa: producto.compania || '',
            });
            return producto;
        }
        return null;
    };

    // Manejar cambio de código (búsqueda automática)
    const handleCodigoChange = (e) => {
        const codigo = e.target.value;
        setInputData({ ...inputData, codigo });

        if (codigo.length >= 2) {
            buscarProducto(codigo);
        }
    };

    // Agregar item a la venta
    const agregarItem = () => {
        if (!inputData.codigo.trim()) {
            alert('Ingresa un código de producto');
            return;
        }

        if (inputData.cantidad <= 0) {
            alert('La cantidad debe ser mayor a 0');
            return;
        }

        // Buscar producto si no se encontró automáticamente
        let producto = productos.find(p => p.id === inputData.producto_id);
        if (!producto) {
            producto = buscarProducto(inputData.codigo);
            if (!producto) {
                alert('Producto no encontrado. Verifica el código.');
                return;
            }
        }

        const precioUnitario = inputData.precio || producto.precio_base || 0;
        const subtotal = precioUnitario * inputData.cantidad;

        const nuevoItem = {
            id: Date.now(),
            producto_id: producto.id,
            codigo: inputData.codigo,
            nombre: producto.nombre,
            empresa: producto.compania || inputData.empresa,
            cantidad: inputData.cantidad,
            precio_unitario: precioUnitario,
            subtotal: subtotal,
        };

        const nuevosItems = [...items, nuevoItem];
        setItems(nuevosItems);

        // Calcular totales
        const totalGeneral = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
        setTotales({ subtotal: totalGeneral, total: totalGeneral });

        // Resetear input
        setInputData({
            empresa: 'Entel',
            codigo: '',
            cantidad: 1,
            precio: 0,
            producto_id: '',
        });
    };

    // Eliminar item
    const eliminarItem = (id) => {
        const nuevosItems = items.filter(item => item.id !== id);
        setItems(nuevosItems);
        const totalGeneral = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
        setTotales({ subtotal: totalGeneral, total: totalGeneral });
    };

    // Guardar venta
    const guardarVenta = async () => {
        if (!formData.cliente_id) {
            alert('Selecciona un cliente');
            return;
        }
        if (items.length === 0) {
            alert('Agrega al menos un producto');
            return;
        }

        const ventaData = {
            distribuidor_id: user.id,
            cliente_id: formData.cliente_id,
            ruta_id: formData.ruta_id,
            subtotal: totales.subtotal,
            descuento_total: 0,
            total: totales.total,
            metodo_pago: formData.metodo_pago,
            observacion: formData.observacion,
        };

        const venta = await crearVenta(ventaData);
        if (venta) {
            const detalles = items.map(item => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: item.subtotal,
                total: item.subtotal,
            }));
            await crearDetallesVenta(venta.id, detalles);
            alert('✅ Venta registrada exitosamente');
            // Resetear
            setItems([]);
            setTotales({ subtotal: 0, total: 0 });
            setFormData({ ...formData, cliente_id: '', observacion: '' });
        }
    };

    // Obtener color de empresa
    const getColorEmpresa = (nombre) => {
        const empresa = empresas.find(e => e.nombre === nombre);
        return empresa?.color_primario || '#6366f1';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">💰 Nueva Venta</h2>

            {/* Selección de Ruta y Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ruta</label>
                    <select
                        value={formData.ruta_id}
                        onChange={handleRutaChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Seleccionar ruta</option>
                        {rutas.map(ruta => (
                            <option key={ruta.id} value={ruta.id}>
                                {ruta.nombre} - {ruta.ciudad}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <select
                        value={formData.cliente_id}
                        onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Seleccionar cliente</option>
                        {clientes.map(cliente => (
                            <option key={cliente.id} value={cliente.id}>
                                {cliente.nombre} {cliente.apellido || ''} - {cliente.telefono || ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ===== FORMULARIO DE PRODUCTOS ===== */}
            <div className="border-t border-gray-200 pt-4 mt-2">

                {/* Entel - Principal */}
                <div
                    className="rounded-lg p-4 mb-3"
                    style={{
                        backgroundColor: `${getColorEmpresa('Entel')}15`,
                        borderLeft: `4px solid ${getColorEmpresa('Entel')}`
                    }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getColorEmpresa('Entel') }}
                        ></span>
                        <span className="font-bold text-gray-800">Entel</span>
                        <span className="text-xs text-gray-400">(Más vendido)</span>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs text-gray-600 mb-1">Código</label>
                            <input
                                type="text"
                                value={inputData.empresa === 'Entel' ? inputData.codigo : ''}
                                onChange={(e) => {
                                    setInputData({ ...inputData, empresa: 'Entel', codigo: e.target.value });
                                    handleCodigoChange(e);
                                }}
                                placeholder="Ej: ENTEL10"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                            <input
                                type="number"
                                value={inputData.empresa === 'Entel' ? inputData.cantidad : 1}
                                onChange={(e) => setInputData({ ...inputData, empresa: 'Entel', cantidad: parseInt(e.target.value) || 1 })}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Subtotal</label>
                            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700">
                                Bs. {(inputData.empresa === 'Entel' ? (inputData.precio || 0) * inputData.cantidad : 0).toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (inputData.empresa === 'Entel') agregarItem();
                        }}
                        className="mt-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                        + Agregar
                    </button>
                </div>

                {/* Flecha hacia abajo */}
                <div className="flex justify-center my-2 text-gray-400">
                    <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>

                {/* Tigo y Viva */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['Tigo', 'Viva'].map(empresa => (
                        <div
                            key={empresa}
                            className="rounded-lg p-4"
                            style={{
                                backgroundColor: `${getColorEmpresa(empresa)}10`,
                                borderLeft: `4px solid ${getColorEmpresa(empresa)}`
                            }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getColorEmpresa(empresa) }}
                                ></span>
                                <span className="font-bold text-gray-800">{empresa}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1">
                                    <label className="block text-xs text-gray-600 mb-1">Código</label>
                                    <input
                                        type="text"
                                        value={inputData.empresa === empresa ? inputData.codigo : ''}
                                        onChange={(e) => {
                                            setInputData({ ...inputData, empresa, codigo: e.target.value });
                                            handleCodigoChange(e);
                                        }}
                                        placeholder="Código"
                                        className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Cant.</label>
                                    <input
                                        type="number"
                                        value={inputData.empresa === empresa ? inputData.cantidad : 1}
                                        onChange={(e) => setInputData({ ...inputData, empresa, cantidad: parseInt(e.target.value) || 1 })}
                                        min="1"
                                        className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Subtotal</label>
                                    <div className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 text-center">
                                        Bs. {(inputData.empresa === empresa ? (inputData.precio || 0) * inputData.cantidad : 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (inputData.empresa === empresa) agregarItem();
                                }}
                                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                + Agregar
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== LISTA DE ITEMS ===== */}
            {items.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Productos Agregados</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left">Código</th>
                                    <th className="px-3 py-2 text-left">Producto</th>
                                    <th className="px-3 py-2 text-center">Cant.</th>
                                    <th className="px-3 py-2 text-right">Precio</th>
                                    <th className="px-3 py-2 text-right">Subtotal</th>
                                    <th className="px-3 py-2 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-3 py-2 font-mono text-xs">{item.codigo}</td>
                                        <td className="px-3 py-2">
                                            <span
                                                className="inline-block w-2 h-2 rounded-full mr-1"
                                                style={{ backgroundColor: getColorEmpresa(item.empresa) }}
                                            ></span>
                                            {item.nombre}
                                        </td>
                                        <td className="px-3 py-2 text-center">{item.cantidad}</td>
                                        <td className="px-3 py-2 text-right">Bs. {item.precio_unitario.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right font-semibold">Bs. {item.subtotal.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                onClick={() => eliminarItem(item.id)}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 font-bold">
                                <tr>
                                    <td colSpan="4" className="px-3 py-2 text-right">TOTAL:</td>
                                    <td className="px-3 py-2 text-right text-blue-600">
                                        Bs. {totales.total.toFixed(2)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== METODO DE PAGO Y GUARDAR ===== */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Método de Pago
                    </label>
                    <select
                        value={formData.metodo_pago}
                        onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="qr">QR</option>
                        <option value="credito">Crédito</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observación
                    </label>
                    <input
                        type="text"
                        value={formData.observacion}
                        onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                        placeholder="Nota adicional (opcional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Botón Guardar */}
            <button
                onClick={guardarVenta}
                disabled={loading || items.length === 0}
                className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Guardando...' : '✅ Registrar Venta'}
            </button>
        </div>
    );
}