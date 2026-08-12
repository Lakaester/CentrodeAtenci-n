import { useState, useEffect } from "react";
import { devToolsService } from "../services/devToolsService";
import type { DevEvent } from "../types";

export function useDevTools() {
  const [events, setEvents] = useState<DevEvent[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ev, tp] = await Promise.all([
        devToolsService.getEventHistory(),
        devToolsService.getEventTypes(),
      ]);
      setEvents(ev);
      setTypes(tp);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return { events, types, loading, refresh: load };
}
