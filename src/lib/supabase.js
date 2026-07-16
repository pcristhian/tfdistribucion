import { createClient } from '@supabase/supabase-js';

// Las variables se cargan automáticamente desde .env.local en la raíz
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: Faltan variables de entorno');
    console.error('   Archivo .env.local debe estar en:', process.cwd());
    throw new Error('Supabase credentials not configured');
}

console.log('✅ Supabase inicializado correctamente');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);