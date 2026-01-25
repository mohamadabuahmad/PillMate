import { useState, useEffect, useRef } from "react";
import { httpsCallable } from "firebase/functions";
import { onAuthStateChanged } from "firebase/auth";
import { functions, auth } from "../src/firebase";

export function useMedicationSuggestions(query: string, enabled: boolean = true) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Wait for auth to be ready
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthReady(!!user);
    });

    if (auth.currentUser) {
      setAuthReady(true);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Don't fetch if disabled, query too short, or auth not ready
    if (!enabled || !query.trim() || query.trim().length < 2 || !authReady) {
      setSuggestions([]);
      return;
    }

    // Debounce API calls (500ms after user stops typing)
    debounceTimer.current = setTimeout(async () => {
      if (!auth.currentUser) {
        setSuggestions([]);
        return;
      }

      setLoading(true);

      try {
        const suggestFunction = httpsCallable(functions, "getMedicationSuggestions");
        const result = await suggestFunction({
          query: query.trim(),
          limit: 5,
        });

        const data = result.data as { suggestions: string[] };
        setSuggestions(data.suggestions || []);
      } catch (err: any) {
        console.error("Error fetching suggestions:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, enabled, authReady]);

  return { suggestions, loading };
}
