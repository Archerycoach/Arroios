import { useState, useEffect } from "react";
import { frontendTextsService } from "@/services/frontendTextsService";

export function useFrontendTexts(page: string) {
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadTexts = async () => {
      try {
        const data = await frontendTextsService.getTextsMap(page);
        if (mounted) {
          setTexts(data);
        }
      } catch (error) {
        console.error(`Error loading texts for page ${page}:`, error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTexts();

    return () => {
      mounted = false;
    };
  }, [page]);

  const t = (key: string, defaultValue: string = ""): string => {
    return texts[key] || defaultValue;
  };

  return { texts, loading, t };
}