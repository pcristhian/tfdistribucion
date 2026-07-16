'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from './login/hook/useLogin';

export default function DashboardPage() {
  const { getUser, logout } = useLogin();
  const router = useRouter();
  const user = getUser();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏰</span>
            <h1 className="text-xl font-bold text-gray-800">Torre Fuerte</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user.nombre}</p>
              <p className="text-xs text-gray-500">@{user.usuario} • {user.rol}</p>
              {user.distribucion && (
                <p className="text-xs text-blue-600">📍 {user.distribucion}</p>
              )}
            </div>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ¡Bienvenido, {user.nombre}!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="text-sm text-blue-600">Rol</p>
              <p className="text-xl font-bold text-blue-800 capitalize">{user.rol}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl">
              <p className="text-sm text-purple-600">Usuario</p>
              <p className="text-xl font-bold text-purple-800">@{user.usuario}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <p className="text-sm text-green-600">Estado</p>
              <p className="text-xl font-bold text-green-800">✅ Activo</p>
            </div>
            {user.distribucion && (
              <div className="bg-orange-50 p-4 rounded-xl md:col-span-3">
                <p className="text-sm text-orange-600">📍 Distribución</p>
                <p className="text-xl font-bold text-orange-800">{user.distribucion}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}