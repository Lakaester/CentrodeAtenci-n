/** Configuración del frontend leída de las variables VITE_*. */
export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? "/api",
};
