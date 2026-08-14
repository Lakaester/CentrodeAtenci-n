/** Cliente HTTP único (axios). Todas las llamadas a la API pasan por aquí. */
import axios from "axios";
import { config } from "@/config/env";

export const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 60000,
  withCredentials: true, // envía la cookie de sesión HttpOnly
});

// Interceptor de respuesta: si la sesión expiró (401) y no es /auth/*, limpiar y redirigir a /login.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url ?? "";
    const esAuth = url.includes("/auth/");
    if (status === 401 && !esAuth && typeof window !== "undefined") {
      // Evitar loops: solo redirigir si aún no estamos en /login.
      if (!window.location.pathname.startsWith("/login")) {
        const params = new URLSearchParams();
        params.set("expired", "1");
        window.location.assign(`/login?${params.toString()}`);
      }
    }
    return Promise.reject(error);
  },
);
