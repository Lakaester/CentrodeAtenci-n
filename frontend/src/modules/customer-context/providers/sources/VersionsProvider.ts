export interface VersionInfo {
  installed: string;
  latest: string;
  status: "actualizado" | "desactualizado" | "critico";
  lastCheck: string;
}

export async function fetchVersions(): Promise<VersionInfo | null> {
  try {
    const resp = await fetch("https://microservices.restaurant.pe/backendrestaurantpe/aplication_version.php");
    const text = await resp.text();
    const installed = text.trim() || "3.12.4";
    return {
      installed,
      latest: "3.13.0",
      status: installed >= "3.13.0" ? "actualizado" : installed >= "3.12.0" ? "desactualizado" : "critico",
      lastCheck: new Date().toISOString(),
    };
  } catch {
    return { installed: "3.12.4", latest: "3.13.0", status: "desactualizado", lastCheck: new Date().toISOString() };
  }
}
