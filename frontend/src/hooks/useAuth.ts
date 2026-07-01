import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook dostępu do stanu uwierzytelnienia.
 * Rzuca błąd, jeśli użyty poza AuthProvider (wczesne wykrycie pomyłki).
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth musi być użyty wewnątrz <AuthProvider>');
  }
  return ctx;
}
