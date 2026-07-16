'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(true); // Siempre visible
  const [isHovered, setIsHovered] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Detectar si ya está instalada (iOS)
    if (window.navigator.standalone) {
      setIsInstalled(true);
      setShowButton(false);
      return;
    }

    // Escuchar el evento beforeinstallprompt (Android/Chrome)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detectar cuando se instala
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowButton(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    });

    // Verificar si ya está instalada (Chrome)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setShowButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Si no hay deferredPrompt, mostrar mensaje alternativo
      alert('Para instalar esta app:\n\n• En Android: Abre Chrome → Menú → "Instalar app"\n• En iOS: Safari → Compartir → "Agregar a pantalla de inicio"');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const outcome = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowButton(false);
        setIsInstalled(true);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error al instalar:', error);
    }
  };

  // Elementos decorativos
  const decorativeElements = [
    { w: 80, h: 80, l: '15%', t: '10%', d: 12 },
    { w: 60, h: 60, l: '75%', t: '20%', d: 15 },
    { w: 100, h: 100, l: '90%', t: '70%', d: 18 },
    { w: 70, h: 70, l: '5%', t: '80%', d: 14 },
    { w: 50, h: 50, l: '45%', t: '5%', d: 16 },
    { w: 90, h: 90, l: '85%', t: '50%', d: 13 },
  ];

  const features = [
    { icon: '⚡', text: 'Rápida' },
    { icon: '📱', text: 'Móvil' },
    { icon: '🔒', text: 'Segura' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950 font-sans overflow-hidden">

      {/* Notificación de instalación */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-green-500/30 flex items-center gap-3 max-w-md mx-auto"
          >
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold">¡Instalación exitosa!</p>
              <p className="text-sm opacity-90">Torre Fuerte está lista para usar</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex flex-col items-center justify-center min-h-screen px-4 relative">

        {/* Elementos decorativos */}
        {isMounted && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {decorativeElements.map((el, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20"
                style={{
                  width: el.w,
                  height: el.h,
                  left: el.l,
                  top: el.t,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, 20, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: el.d,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            ))}
          </div>
        )}

        {/* Contenido principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", damping: 15 }}
          className="relative z-10 w-full max-w-2xl flex flex-col items-center"
        >

          {/* Logo */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20"
              />
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-6 shadow-2xl">
                <Image
                  className="dark:invert"
                  src="/next.svg"
                  alt="Torre Fuerte"
                  width={80}
                  height={80}
                  priority
                />
              </div>
            </div>
          </motion.div>

          {/* Título */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-4"
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
            >
              Torre Fuerte
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-gray-600 dark:text-gray-300 mt-2 text-lg"
            >
              Distribución Inteligente
            </motion.p>
          </motion.div>

          {/* Descripción */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8 px-4"
          >
            La mejor plataforma para la distribución de torres fuertes.
            Instala nuestra app y lleva el control donde quieras.
          </motion.p>

          {/* Características */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="grid grid-cols-3 gap-4 w-full max-w-md mb-10"
          >
            {features.map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 text-center shadow-lg"
              >
                <div className="text-3xl">{item.icon}</div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* BOTÓN DE INSTALACIÓN - SIEMPRE VISIBLE */}
          {showButton && !isInstalled && (
            <motion.button
              onClick={handleInstall}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
              className="relative group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-5 px-16 rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 flex items-center gap-4 text-xl overflow-hidden"
            >
              {/* Efecto de brillo */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: isHovered ? '100%' : '-100%' }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />

              {/* Icono de descarga animado */}
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </motion.svg>

              <span className="text-xl font-bold">📱 Instalar App</span>

              {/* Badge de versión */}
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg shadow-green-500/40 font-bold"
              >
                v2.0
              </motion.span>
            </motion.button>
          )}

          {/* Mensaje de instalado */}
          {isInstalled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring" }}
              className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-8 py-4 rounded-full shadow-lg flex items-center gap-3"
            >
              <span className="text-3xl">✅</span>
              <span className="font-semibold text-lg">App instalada correctamente</span>
            </motion.div>
          )}

          {/* Texto de ayuda para instalación */}
          {showButton && !isInstalled && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs"
            >
              💡 Haz clic en el botón para instalar la app en tu dispositivo
            </motion.p>
          )}

          {/* Botón de prueba (para desarrollo) */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!showButton) {
                setShowButton(true);
                setIsInstalled(false);
              }
            }}
            className="mt-8 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 underline-offset-2 hover:underline transition-colors bg-white/50 dark:bg-gray-800/50 px-4 py-2 rounded-full backdrop-blur-sm"
          >
            {showButton ? '🔄 Modo prueba (reiniciar)' : '🔧 Mostrar botón'}
          </motion.button>

        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-8 text-center text-sm text-gray-400 dark:text-gray-600"
        >
          <p>© 2024 Torre Fuerte - Distribución Inteligente</p>
        </motion.div>

      </main>
    </div>
  );
}