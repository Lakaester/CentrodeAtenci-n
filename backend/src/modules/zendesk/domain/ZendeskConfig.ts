/** @deprecated Este módulo ha sido reemplazado por modules/zendesk-test/. Se eliminará en M2. */
export interface ZendeskEnvConfig {
  subdomain: string;
  email: string;
  token: string;
}

export function loadZendeskConfig(): ZendeskEnvConfig {
  return {
    subdomain: process.env.ZENDESK_SUBDOMAIN ?? "",
    email: process.env.ZENDESK_EMAIL ?? "",
    token: process.env.ZENDESK_API_TOKEN ?? "",
  };
}

export function isZendeskConfigurado(config: ZendeskEnvConfig): boolean {
  return !!(config.subdomain && config.email && config.token);
}

