/** Cliente HTTP único (axios). Todas las llamadas a la API pasan por aquí. */
import axios from "axios";
import { config } from "@/config/env";

export const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 60000,
});
