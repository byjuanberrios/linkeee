import "server-only";
import { classifyByPath } from "./path-heuristics";
import { classifyFromHtml } from "./structured-data";

export interface ClassifyResult {
  category: string | null;
  tags: string[];
  source: "path" | "structured-data" | "none";
}

export function classifyUrl(url: string, html?: string): ClassifyResult {
  // 1. Path heuristics — instantáneo, sin necesidad de HTML
  const pathCategory = classifyByPath(url);
  if (pathCategory) {
    return {
      category: pathCategory,
      tags: [],
      source: "path",
    };
  }

  // 2. Structured data del HTML (si está disponible)
  if (html) {
    const sd = classifyFromHtml(html);
    if (sd.category || sd.tags.length > 0) {
      return {
        category: sd.category,
        tags: sd.tags,
        source: "structured-data",
      };
    }
  }

  return {
    category: null,
    tags: [],
    source: "none",
  };
}