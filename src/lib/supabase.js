import { createClient } from '@supabase/supabase-js';

// 🔥 === CONFIGURACIÓN DIRECTA ===
// Reemplaza con tus credenciales reales de Supabase
// Obtenlas en: Settings → API de tu proyecto
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';
// ===============================

// Verificar que las credenciales existan
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Error: Configura SUPABASE_URL y SUPABASE_ANON_KEY');
    console.error('   Ve a Settings → API en tu proyecto de Supabase');
}

// ✅ El export SIEMPRE en el nivel superior, fuera de cualquier bloque
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase inicializado correctamente');