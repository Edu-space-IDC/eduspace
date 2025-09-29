// ARCHIVO COMPLETAMENTE DESHABILITADO
// Esta aplicación usa IndexedDB local, no Supabase

/* NOTA IMPORTANTE:
 * Esta aplicación funciona completamente offline con IndexedDB
 * No necesita edge functions ni base de datos externa
 * Todos los datos se almacenan localmente en el navegador del usuario
 * 
 * Para evitar errores de deployment, todas las funciones están deshabilitadas
 */

// Funciones deshabilitadas - solo retornan mensajes de error
export const set = async (key: string, value: any): Promise<void> => {
  throw new Error("Supabase deshabilitado - usa IndexedDB local");
};

export const get = async (key: string): Promise<any> => {
  throw new Error("Supabase deshabilitado - usa IndexedDB local");
};

export const del = async (key: string): Promise<void> => {
  throw new Error("Supabase deshabilitado - usa IndexedDB local");
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  throw new Error("Supabase deshabilitado - usa IndexedDB local");
};

export const mget = async (keys: string[]): Promise<any[]> => {
  throw new Error("Supabase deshabilitado - usa IndexedDB local");
};

export const mdel = async (keys: string[]): Promise<void> => {
  throw new Error("Supabase deshabilitado - usa IndexedDB local");
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  throw new Error("Supabase deshabilitado - usa IndexedDB local");
};