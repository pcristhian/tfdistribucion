// lib/boliviaTime.js
'use client';

/**
 * Obtiene la fecha actual en Bolivia (UTC-4)
 * Como el navegador ya está en la zona horaria local,
 * NO debemos restar horas, solo usar la fecha directamente
 */
export function getBoliviaDate() {
    // ✅ El navegador ya tiene la hora local de Bolivia
    // Solo devolvemos la fecha actual sin modificaciones
    return new Date();
}

/**
 * Obtiene la fecha actual en Bolivia como string YYYY-MM-DD
 */
export function getBoliviaDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Verifica si una fecha es pasada (menor que hoy en Bolivia)
 */
export function isPastDate(date) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaComparar = new Date(date);
    fechaComparar.setHours(0, 0, 0, 0);

    return fechaComparar < hoy;
}

/**
 * Verifica si una fecha es hoy en Bolivia
 */
export function isTodayInBolivia(date) {
    const hoy = getBoliviaDateString();
    const fechaComparar = new Date(date);
    const year = fechaComparar.getFullYear();
    const month = String(fechaComparar.getMonth() + 1).padStart(2, '0');
    const day = String(fechaComparar.getDate()).padStart(2, '0');
    const fechaStr = `${year}-${month}-${day}`;
    return fechaStr === hoy;
}

/**
 * Formatea una fecha para mostrar en Bolivia
 */
export function formatBoliviaDate(date) {
    const fecha = new Date(date);
    return fecha.toLocaleDateString('es-BO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Convierte una fecha de la BD (UTC) a fecha Bolivia
 * Esto es importante porque Supabase guarda fechas en UTC
 */
export function fromDBDate(dateStr) {
    if (!dateStr) return null;
    // La fecha de la BD viene en UTC, la convertimos a local
    const date = new Date(dateStr);
    // No hacemos ajustes, el navegador ya la convierte automáticamente
    return date;
}

/**
 * Convierte una fecha Bolivia a UTC para guardar en la BD
 */
export function toDBDate(date) {
    if (!date) return null;
    // Convertir a UTC para guardar en Supabase
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}