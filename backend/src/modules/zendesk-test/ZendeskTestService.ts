export interface ZendeskUserInfo {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  organizacion: string | null;
}

export interface TestResult {
  success: boolean;
  data?: ZendeskUserInfo;
  error?: { code: string; message: string; httpStatus?: number };
  timing: number;
}

export class ZendeskTestService {
  async testConnection(): Promise<TestResult> {
    const subdomain = process.env.ZENDESK_SUBDOMAIN ?? "";
    const email = process.env.ZENDESK_EMAIL ?? "";
    const token = process.env.ZENDESK_API_TOKEN ?? "";

    if (!subdomain || !email || !token) {
      return {
        success: false,
        error: {
          code: "MISSING_CONFIG",
          message: "Faltan variables de entorno: ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN",
        },
        timing: 0,
      };
    }

    const baseUrl = `https://${subdomain}.zendesk.com/api/v2`;
    const auth = Buffer.from(`${email}/token:${token}`).toString("base64");
    const start = Date.now();

    try {
      const response = await fetch(`${baseUrl}/users/me.json`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      const elapsed = Date.now() - start;

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        const error = this.mapError(response.status, body);
        console.log(`[ZendeskTest] /users/me — ${response.status} — ${elapsed}ms — ERROR`);
        return { success: false, error, timing: elapsed };
      }

      const data = await response.json();
      const user = data.user;
      console.log(`[ZendeskTest] /users/me — 200 — ${elapsed}ms — OK (${user.name})`);

      return {
        success: true,
        data: {
          id: user.id,
          nombre: user.name,
          correo: user.email,
          rol: user.role,
          organizacion: user.organization_id ? `Org #${user.organization_id}` : null,
        },
        timing: elapsed,
      };
    } catch (err) {
      const elapsed = Date.now() - start;
      return {
        success: false,
        error: { code: "NETWORK_ERROR", message: err instanceof Error ? err.message : "Error de conexión" },
        timing: elapsed,
      };
    }
  }

  private mapError(status: number, body: string): { code: string; message: string; httpStatus: number } {
    switch (status) {
      case 401: return { code: "AUTH_ERROR", message: "Credenciales inválidas. Verificar ZENDESK_EMAIL y ZENDESK_API_TOKEN.", httpStatus: 401 };
      case 403: return { code: "FORBIDDEN", message: "Sin permisos para acceder a la API de Zendesk.", httpStatus: 403 };
      case 404: return { code: "NOT_FOUND", message: "Endpoint no encontrado. Verificar ZENDESK_SUBDOMAIN.", httpStatus: 404 };
      case 429: return { code: "RATE_LIMIT", message: "Límite de peticiones alcanzado. Reintentar más tarde.", httpStatus: 429 };
      default: return { code: "API_ERROR", message: body || `Error HTTP ${status}`, httpStatus: status };
    }
  }
}
