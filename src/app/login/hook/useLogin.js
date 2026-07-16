'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export function useLogin() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const login = async (email, password) => {
        setLoading(true);
        setError('');

        try {
            const { data: user, error: userError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('email', email)
                .eq('activo', true)
                .single();

            if (userError || !user) {
                setError('Usuario no encontrado');
                setLoading(false);
                return false;
            }

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                setError('Contraseña incorrecta');
                setLoading(false);
                return false;
            }

            const { password: _, ...userWithoutPassword } = user;
            localStorage.setItem('distribuidor_user', JSON.stringify(userWithoutPassword));

            router.push('/dashboard');
            return true;

        } catch (error) {
            console.error('Error en login:', error);
            setError('Error al iniciar sesión');
            setLoading(false);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('distribuidor_user');
        router.push('/login');
    };

    const getUser = () => {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('distribuidor_user');
            return user ? JSON.parse(user) : null;
        }
        return null;
    };

    const isAuthenticated = () => {
        return !!getUser();
    };

    return {
        login,
        logout,
        getUser,
        isAuthenticated,
        loading,
        error
    };
}