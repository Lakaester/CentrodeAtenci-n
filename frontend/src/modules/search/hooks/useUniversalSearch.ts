import { useState, useEffect, useRef } from "react";
import { searchService } from "../services/searchService";
import type { SearchResult } from "../types";

const DEBOUNCE_MS = 300;
const RECENT_KEY = "cope_search_recent";

export function useUniversalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [detectedType, setDetectedType] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
  });
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setDetectedType("");
      return;
    }
    setLoading(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchService.search(query);
        setResults(data.results);
        setDetectedType(data.type);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const addRecent = (q: string) => {
    const updated = [q, ...recent.filter((r) => r !== q)].slice(0, 10);
    setRecent(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  return { query, setQuery, results, detectedType, loading, recent, addRecent };
}
