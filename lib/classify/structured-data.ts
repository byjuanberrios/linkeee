import "server-only";
import { schemaTypeToCategory, ogTypeToCategory, ogSectionToCategory } from "./mapping";

export interface StructuredDataResult {
  category: string | null;
  tags: string[];
}

interface OgData {
  type?: string;
  section?: string;
  tags?: string[];
}

function parseOgMeta(html: string): OgData {
  const result: OgData = {};

  const getMeta = (property: string): string | null => {
    const re = new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    );
    const match = html.match(re);
    return match ? match[1].trim() : null;
  };

  const type = getMeta("og:type");
  if (type) result.type = type;

  const section = getMeta("og:article:section");
  if (section) result.section = section;

  const tags: string[] = [];
  const tagRe = /<meta[^>]+property=["']og:article:tag["'][^>]+content=["']([^"']+)["']/gi;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    if (m[1].trim()) tags.push(m[1].trim().toLowerCase());
  }
  if (tags.length > 0) result.tags = tags.slice(0, 5);

  return result;
}

function parseJsonLd(html: string): { types: string[]; tags: string[] } {
  const types: string[] = [];
  const tags: string[] = [];

  const blockRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = blockRe.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        const rawType = item["@type"];
        if (rawType) {
          const typeArr = Array.isArray(rawType) ? rawType : [rawType];
          for (const t of typeArr) {
            if (typeof t === "string") types.push(t);
          }
        }

        const rawKeywords = item.keywords;
        if (rawKeywords) {
          const kwArr = Array.isArray(rawKeywords) ? rawKeywords : String(rawKeywords).split(",").map(k => k.trim());
          for (const k of kwArr) {
            if (k && tags.length < 5) tags.push(k.toLowerCase());
          }
        }
      }
    } catch {
      // JSON-LD malformado, ignorar
    }
  }

  return { types, tags };
}

function parseMetaKeywords(html: string): string[] {
  const re = /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i;
  const m = html.match(re);
  if (!m) return [];
  return m[1].split(",").map(k => k.trim().toLowerCase()).filter(Boolean).slice(0, 5);
}

export function classifyFromHtml(html: string): StructuredDataResult {
  let category: string | null = null;
  const tags: string[] = [];

  // 1. Open Graph
  const og = parseOgMeta(html);

  if (og.section) {
    const fromSection = ogSectionToCategory(og.section);
    if (fromSection) category = fromSection;
  }

  if (!category && og.type) {
    const fromType = ogTypeToCategory(og.type);
    if (fromType && fromType !== "Sin categorizar") category = fromType;
  }

  if (og.tags) {
    for (const t of og.tags) {
      if (!tags.includes(t)) tags.push(t);
    }
  }

  // 2. JSON-LD
  const ld = parseJsonLd(html);

  if (!category) {
    for (const type of ld.types) {
      const fromSchema = schemaTypeToCategory(type);
      if (fromSchema && fromSchema !== "Sin categorizar") {
        category = fromSchema;
        break;
      }
    }
  }

  for (const t of ld.tags) {
    if (!tags.includes(t)) tags.push(t);
  }

  // 3. Meta keywords (último recurso para tags)
  if (tags.length < 3) {
    const kw = parseMetaKeywords(html);
    for (const k of kw) {
      if (!tags.includes(k)) tags.push(k);
    }
  }

  return {
    category,
    tags: tags.slice(0, 5),
  };
}