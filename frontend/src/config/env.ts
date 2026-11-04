/** Configuración del frontend leída de las variables VITE_*. */
export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? "/api",
  /**
   * Base pública del microservicio de desarrollo (Tareabi).
   * Solo se usa para enlazar al expediente oficial del ticket/tarea.
   * No se inventa: la ruta verificada es {base}/tareabi/{tareabi_id}.
   */
  tareabiApiUrl:
    import.meta.env.VITE_TAREABI_API_URL ??
    "https://microservices.restaurant.pe/backendrestaurantpe/public/rest/tareabi",
};
