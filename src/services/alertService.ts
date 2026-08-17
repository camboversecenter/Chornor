// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import Swal from 'sweetalert2';

export const showAlert = (title: string, text?: string, icon: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor: '#4F46E5', // Indigo-600
    confirmButtonText: 'យល់ព្រម (OK)',
    customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
    }
  });
};

export const showConfirm = async (
    title: string, 
    text?: string, 
    confirmText: string = 'យល់ព្រម (Yes)', 
    cancelText: string = 'បោះបង់ (Cancel)'
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444', // Red-500
    cancelButtonColor: '#9CA3AF', // Gray-400
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        cancelButton: 'rounded-xl px-6 py-2.5 font-bold'
    }
  });
  return result.isConfirmed;
};
