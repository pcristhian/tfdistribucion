'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from './login/hook/useLogin';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const { getUser } = useLogin();
  const router = useRouter();
  const user = getUser();
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Verificar si la app ya está instalada
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);
    setLoading(false);

    // Mostrar contenido con delay para animación de entrada
    setTimeout(() => setShowContent(true), 300);

    // Escuchar evento de instalación
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Si ya está instalada, redirigir al login o dashboard
  useEffect(() => {
    if (!loading && isInstalled) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isInstalled, user, router, loading]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  // Variants para animaciones
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    idle: {
      scale: 1,
      boxShadow: "0 10px 30px -10px rgba(59, 130, 246, 0.3)"
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.5)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.95,
      boxShadow: "0 5px 20px -10px rgba(59, 130, 246, 0.3)"
    },
    pulse: {
      scale: [1, 1.02, 1],
      boxShadow: [
        "0 10px 30px -10px rgba(59, 130, 246, 0.3)",
        "0 20px 50px -10px rgba(59, 130, 246, 0.6)",
        "0 10px 30px -10px rgba(59, 130, 246, 0.3)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const iconVariants = {
    float: {
      y: [0, -20, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const floatingBubbleVariants = {
    float1: {
      y: [0, -30, 0],
      x: [0, 20, -20, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    float2: {
      y: [0, 40, 0],
      x: [0, -30, 30, 0],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    float3: {
      y: [0, -25, 0],
      x: [0, -15, 15, 0],
      transition: {
        duration: 7,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Mientras carga, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-16 w-16 border-4 border-white border-t-transparent"
        />
      </div>
    );
  }

  // Si ya está instalada, no mostrar nada (redirige)
  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-16 w-16 border-4 border-white border-t-transparent"
        />
      </div>
    );
  }

  // SOLO mostrar la pantalla de instalación si NO está instalada
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo con burbujas animadas con Framer Motion */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          variants={floatingBubbleVariants}
          animate="float1"
          className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        <motion.div
          variants={floatingBubbleVariants}
          animate="float2"
          className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        <motion.div
          variants={floatingBubbleVariants}
          animate="float3"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10"
        />
      </div>

      <AnimatePresence>
        {showContent && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center relative z-10"
          >
            {/* Icono con animación de flotación */}
            <motion.div
              variants={iconVariants}
              animate="float"
              className="text-8xl mb-6 inline-block"
            >
              🏰
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Torre Fuerte
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-gray-600 mb-2 text-lg"
            >
              Instala la aplicación para continuar
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"
            />

            <motion.p
              variants={itemVariants}
              className="text-sm text-gray-400 mb-8"
            >
              Disfruta de una experiencia completa y sin interrupciones
            </motion.p>

            {/* Botón de instalación - CON FRAMER MOTION */}
            {isIOS ? (
              <motion.div
                variants={itemVariants}
                className="space-y-4"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4"
                >
                  <p className="text-sm text-yellow-800 font-medium">
                    📱 Para instalar en iOS:
                  </p>
                  <ol className="text-xs text-yellow-700 text-left mt-2 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="bg-yellow-200 text-yellow-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                      Toca el ícono de compartir <span className="font-bold text-base">⎙</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="bg-yellow-200 text-yellow-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                      Desliza hacia abajo y selecciona <span className="font-bold">"Agregar a pantalla de inicio"</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="bg-yellow-200 text-yellow-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                      Toca <span className="font-bold">"Agregar"</span>
                    </li>
                  </ol>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium"
                >
                  🔄 Verificar instalación
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                variants={itemVariants}
                className="space-y-4"
              >
                {/* Botón principal con animaciones avanzadas */}
                <motion.button
                  variants={buttonVariants}
                  initial="idle"
                  animate={["idle", "pulse"]}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-5 rounded-xl font-bold text-lg relative overflow-hidden"
                >
                  {/* Efecto de brillo deslizante */}
                  <motion.span
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  />

                  <span className="relative flex items-center justify-center gap-3">
                    <motion.span
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="text-3xl"
                    >
                      ⬇️
                    </motion.span>
                    <span>Instalar App</span>
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="text-sm font-normal"
                    >
                      (Gratis)
                    </motion.span>
                  </span>
                </motion.button>

                {/* Texto de ayuda con animación */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xs text-gray-400"
                >
                  Haz clic en el botón para instalar la aplicación
                </motion.p>

                {/* Barra de progreso animada */}
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    animate={{
                      width: ["0%", "70%", "100%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                  />
                </div>
              </motion.div>
            )}

            {/* Botón para verificar si ya instaló */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="mt-6 text-xs text-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="text-base inline-block"
              >
                🔄
              </motion.span>
              ¿Ya instalaste? Haz clic aquí para verificar
            </motion.button>

            {/* Footer con información */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 pt-4 border-t border-gray-100"
            >
              <p className="text-[10px] text-gray-400">
                Versión 1.0 • Torre Fuerte • {new Date().getFullYear()}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}