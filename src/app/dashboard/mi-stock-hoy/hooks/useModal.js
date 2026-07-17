// hooks/useModal.js
'use client';

import { useState, useCallback } from 'react';

export function useModal() {
    const [isOpen, setIsOpen] = useState(false);

    const openModal = useCallback(() => setIsOpen(true), []);
    const closeModal = useCallback(() => setIsOpen(false), []);
    const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);

    return {
        isOpen,
        openModal,
        closeModal,
        toggleModal,
        setIsOpen,
    };
}