'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '../../login/hook/useLogin';
import { useEditProductos } from './hooks/useEditProducto';
import { useDeleteProducto } from './hooks/useDeleteProducto';
import { useCreateProducto } from './hooks/useCreateProducto'; // ✅ Importar
import Header from './components/Header';
import Tabla from './components/Tabla';
import ModalEditarProductos from './components/ModalEditarProductos';
import ModalCrearProducto from './components/ModalCrearProducto'; // ✅ Importar

export default function ProductosPage() {
    const { getUser } = useLogin();
    const router = useRouter();
    const user = getUser();

    // ✅ TODAS las funciones del hook en el nivel superior
    const {
        getProductos,
        updateProducto,
        loading: loadingProductos,
        getEmpresas,
        getCategorias
    } = useEditProductos();

    const { desactivarProducto, activarProducto } = useDeleteProducto();

    // ✅ Hook para crear productos
    const {
        createProducto,
        loading: loadingCreate,
        reset: resetCreate
    } = useCreateProducto();

    const [productos, setProductos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false); // ✅ Nuevo estado
    const [productoEditando, setProductoEditando] = useState(null);
    const [empresas, setEmpresas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [saving, setSaving] = useState(false);

    const isFirstRender = useRef(true);

    const cargarProductos = useCallback(async () => {
        setIsLoading(true);
        const data = await getProductos();
        if (data) {
            setProductos(data);
        }
        setIsLoading(false);
    }, [getProductos]);

    // ✅ Función para cargar datos del modal
    const cargarDatosModal = useCallback(async () => {
        try {
            const [empresasData, categoriasData] = await Promise.all([
                getEmpresas(),
                getCategorias()
            ]);
            setEmpresas(empresasData || []);
            setCategorias(categoriasData || []);
        } catch (error) {
            console.error('Error al cargar datos del modal:', error);
        }
    }, [getEmpresas, getCategorias]);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (isFirstRender.current) {
            isFirstRender.current = false;
            cargarProductos();
            cargarDatosModal();
        }
    }, [user, router, cargarProductos, cargarDatosModal]);

    const handleToggleActivo = async (producto) => {
        if (producto.activo) {
            if (confirm(`¿Desactivar "${producto.nombre}"?`)) {
                await desactivarProducto(producto.id);
                await cargarProductos();
            }
        } else {
            if (confirm(`¿Activar "${producto.nombre}"?`)) {
                await activarProducto(producto.id);
                await cargarProductos();
            }
        }
    };

    const handleEdit = (producto) => {
        setProductoEditando(producto);
        setShowEditModal(true);
    };

    const handleSaveEdit = async (data) => {
        setSaving(true);
        await updateProducto(productoEditando.id, data);
        setSaving(false);
        setShowEditModal(false);
        setProductoEditando(null);
        await cargarProductos();
    };

    // ✅ Manejar creación de nuevo producto
    const handleCreateProducto = async (data) => {
        const result = await createProducto(data);
        if (result) {
            setShowCreateModal(false);
            await cargarProductos();
            resetCreate();
            // Mostrar mensaje de éxito
            alert(`✅ Producto "${result.nombre}" creado correctamente`);
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header titulo="Productos" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                            {productos.length} productos
                        </span>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)} // ✅ Abrir modal de creación
                        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="text-lg">+</span>
                        Nuevo Producto
                    </button>
                </div>

                <Tabla
                    productos={productos}
                    loading={loadingProductos}
                    onEdit={handleEdit}
                    onToggleActivo={handleToggleActivo}
                />
            </main>

            {/* Modal Editar */}
            <ModalEditarProductos
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setProductoEditando(null);
                }}
                producto={productoEditando}
                onSave={handleSaveEdit}
                empresas={empresas}
                categorias={categorias}
                loading={saving}
            />

            {/* ✅ Modal Crear */}
            <ModalCrearProducto
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    resetCreate();
                }}
                onSave={handleCreateProducto}
                empresas={empresas}
                categorias={categorias}
                loading={loadingCreate}
            />
        </div>
    );
}