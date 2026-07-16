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
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // ✅ DETECTAR SI LA APP ESTÁ INSTALADA (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);
    setLoading(false);

    setTimeout(() => setShowContent(true), 300);

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

  // ✅ SOLO REDIRIGIR SI ESTÁ INSTALADA
  useEffect(() => {
    if (!loading && isInstalled) {
      setTimeout(() => {
        if (user) {
          router.push('/dashboard');
        } else {
          router.push('/login'); // ✅ SOLO SE VE DESDE LA APP INSTALADA
        }
      }, 500);
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

  // ✅ SI ESTÁ INSTALADA → REDIRIGE (NUNCA se ve el login aquí)
  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-16 w-16 border-4 border-white border-t-transparent"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white ml-4 text-lg font-medium"
        >
          Cargando...
        </motion.p>
      </div>
    );
  }

  // ✅ SOLO PANTALLA DE INSTALACIÓN (NAVEGADOR NORMAL)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Burbujas de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 20, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        <motion.div
          animate={{ y: [0, 40, 0], x: [0, -30, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        <motion.div
          animate={{ y: [0, -25, 0], x: [0, -15, 15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10"
        />
      </div>

      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center relative z-10"
          >
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-8xl mb-6 inline-block"
            >
              🏰
            </motion.div>

            <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Torre Fuerte
            </h1>

            <p className="text-gray-600 mb-2 text-lg">
              Instala la aplicación para continuar
            </p>

            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6" />

            <p className="text-sm text-gray-400 mb-8">
              Disfruta de una experiencia completa y sin interrupciones
            </p>

            {isIOS ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
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
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium"
                >
                  🔄 Verificar instalación
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: [1, 1.02, 1],
                    boxShadow: [
                      "0 10px 30px -10px rgba(59, 130, 246, 0.3)",
                      "0 20px 50px -10px rgba(59, 130, 246, 0.6)",
                      "0 10px 30px -10px rgba(59, 130, 246, 0.3)"
                    ]
                  }}
                  transition={{
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-5 rounded-xl font-bold text-lg relative overflow-hidden"
                >
                  <motion.span
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  />
                  <span className="relative flex items-center justify-center gap-3">
                    <motion.span
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-3xl"
                    >
                      ⬇️
                    </motion.span>
                    <span>Instalar App</span>
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="text-sm font-normal"
                    >
                      (Gratis)
                    </motion.span>
                  </span>
                </motion.button>

                <p className="text-xs text-gray-400">
                  Haz clic en el botón para instalar la aplicación
                </p>

                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: ["0%", "70%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="mt-6 text-xs text-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="text-base inline-block"
              >
                🔄
              </motion.span>
              ¿Ya instalaste? Haz clic aquí para verificar
            </button>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-[10px] text-gray-400">
                Versión 1.0 • Torre Fuerte • {new Date().getFullYear()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}