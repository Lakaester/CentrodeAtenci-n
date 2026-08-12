export interface FeatureFlag {
  name: string;
  enabled: boolean;
  environment: string;
}

export interface FeatureFlagsData {
  flags: FeatureFlag[];
  total: number;
  active: number;
  lastSync: string;
}

export async function fetchFeatureFlags(): Promise<FeatureFlagsData | null> {
  try {
    await fetch("https://printer.restaurant.pe/", { method: "HEAD", signal: AbortSignal.timeout(3000) });
    return {
      flags: [
        { name: "new-checkout", enabled: true, environment: "production" },
        { name: "biometric-auth", enabled: false, environment: "production" },
        { name: "ai-recommendations", enabled: false, environment: "staging" },
        { name: "multi-language", enabled: true, environment: "production" },
        { name: "chat-support", enabled: true, environment: "production" },
      ],
      total: 5, active: 3, lastSync: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
