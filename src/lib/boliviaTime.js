// lib/boliviaTime.js
'use client';

/**
 * Obtiene la fecha actual en Bolivia (UTC-4)
 */
export function getBoliviaDate() {
    const now = new Date();
    // Bolivia está en UTC-4 (restamos 4 horas)
    const boliviaTime = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    return boliviaTime;
}

/**
 * Obtiene la fecha actual en Bolivia como string YYYY-MM-DD
 */
export function getBoliviaDateString() {
    const date = getBoliviaDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Verifica si una fecha es pasada (menor que hoy en Bolivia)
 */
export function isPastDate(date) {
    const hoy = getBoliviaDate();
    const fechaComparar = new Date(date);
    fechaComparar.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);
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