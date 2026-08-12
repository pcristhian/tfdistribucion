'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Carga inicial
    setTimeout(() => {
      setIsLoading(false);
      setShowMenu(true);
    }, 600);
  }, []);

  // Opciones del menú
  const locations = [
    {
      id: 'viacha-tilata',
      nombre: 'Viacha - Tilata',
      icono: '🏘️',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-white',
      borderColor: 'border-blue-200',
      hoverBorder: 'hover:border-blue-500',
      descripcion: 'Zona norte',
      ruta: '/dashboard/viacha-tilata' // ✅ Ruta explícita
    },
    {
      id: 'desaguadero',
      nombre: 'Desaguadero',
      icono: '🌊',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-white',
      borderColor: 'border-cyan-200',
      hoverBorder: 'hover:border-cyan-500',
      descripcion: 'Zona oeste',
      ruta: '/dashboard/desaguadero'
    },
    {
      id: 'pueblos',
      nombre: 'Pueblos',
      icono: '🏡',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-white',
      borderColor: 'border-amber-200',
      hoverBorder: 'hover:border-amber-500',
      descripcion: 'Zona rural',
      ruta: '/dashboard/pueblos'
    },
    {
      id: 'corocoro',
      nombre: 'Corocoro',
      icono: '⛏️',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-white',
      borderColor: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-500',
      descripcion: 'Zona minera',
      ruta: '/dashboard/corocoro'
    }
  ];

  const handleSelectLocation = (location) => {
    // Guardar en localStorage
    localStorage.setItem('ubicacion', location.nombre);
    localStorage.setItem('ubicacionId', location.id);

    // Mostrar overlay
    setSelectedLocation(location);

    // Redirigir después de la animación
    setTimeout(() => {
      router.push(location.ruta); // ✅ Usando la ruta explícita
    }, 500);
  };

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏰</span>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Torre Fuerte</h1>
              <p className="text-xs text-gray-500">Seleccione ubicación</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {new Date().toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </div>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Título */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800">
            Seleccione una ubicación
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Elija la zona donde trabajará hoy
          </p>
        </motion.div>

        {/* Grid de ubicaciones */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {locations.map((location, index) => (
                <motion.button
                  key={location.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1 + (index * 0.08),
                    duration: 0.4
                  }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 8px 25px -8px rgba(0,0,0,0.15)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectLocation(location)}
                  className={`
                    ${location.bgColor}
                    border-2 ${location.borderColor} ${location.hoverBorder}
                    rounded-xl 
                    transition-all duration-200
                    flex items-center gap-4
                    p-5
                    text-left
                    group
                    cursor-pointer
                  `}
                >
                  <span className="text-4xl flex-shrink-0">
                    {location.icono}
                  </span>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-800">
                      {location.nombre}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {location.descripcion}
                    </p>
                  </div>

                  <span className="text-gray-300 group-hover:text-gray-500 transition-colors">
                    →
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400"
        >
          <span>Versión 1.0</span>
          <span>© {new Date().getFullYear()} Torre Fuerte</span>
        </motion.div>
      </main>

      {/* Overlay de selección */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 text-center"
            >
              <div className="text-4xl mb-3">{selectedLocation.icono}</div>
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedLocation.nombre}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Cargando panel de trabajo...
              </p>
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}