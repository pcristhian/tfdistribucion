'use client';

import { useRouter } from 'next/navigation';

export default function Header({ titulo = 'Mi Stock Hoy' }) {
    const router = useRouter();

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-1 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center gap-1.5">
                <button
                    onClick={() => router.push('/')}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800 flex-shrink-0"
                    aria-label="Volver al menú principal"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-lg font-bold text-gray-800">
                    {titulo}
                </h1>
            </div>
        </header>
    );
}