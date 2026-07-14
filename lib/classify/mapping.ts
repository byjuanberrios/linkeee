import "server-only";

export const CATEGORY_VOCABULARY = [
  "Lectura",
  "Video",
  "Herramientas",
  "Desarrollo",
  "Documentación",
  "Diseño",
  "Aprendizaje",
  "Referencia",
  "Noticias",
  "Social",
  "Código",
  "Producto",
  "Música",
  "Cocina",
  "Sin categorizar",
] as const;

export type Category = (typeof CATEGORY_VOCABULARY)[number];

const SCHEMA_ORG_MAP: Record<string, string> = {
  Article: "Lectura",
  NewsArticle: "Noticias",
  BlogPosting: "Lectura",
  TechArticle: "Desarrollo",
  ScholarlyArticle: "Lectura",
  Report: "Lectura",
  Recipe: "Cocina",
  VideoObject: "Video",
  Movie: "Video",
  TVSeries: "Video",
  TVEpisode: "Video",
  MusicRecording: "Música",
  MusicAlbum: "Música",
  MusicGroup: "Música",
  SoftwareApplication: "Herramientas",
  WebApplication: "Herramientas",
  APIReference: "Documentación",
  HowTo: "Aprendizaje",
  Course: "Aprendizaje",
  Book: "Lectura",
  Product: "Producto",
  Offer: "Producto",
  Review: "Lectura",
  QAPage: "Referencia",
  Event: "Referencia",
  Person: "Referencia",
  Organization: "Referencia",
  ProfilePage: "Social",
  Comment: "Social",
  DiscussionForumPosting: "Social",
  SocialMediaPosting: "Social",
  CreativeWork: "Lectura",
  Presentation: "Lectura",
  Thesis: "Lectura",
  DigitalDocument: "Lectura",
};

const OG_TYPE_MAP: Record<string, string> = {
  article: "Lectura",
  book: "Lectura",
  "video.movie": "Video",
  "video.episode": "Video",
  "video.tv_show": "Video",
  "video.other": "Video",
  "music.song": "Música",
  "music.album": "Música",
  "music.playlist": "Música",
  profile: "Social",
  website: "Sin categorizar",
};

export function schemaTypeToCategory(type: string): string | null {
  const clean = type.replace(/^https?:\/\/schema\.org\//i, "").trim();
  if (SCHEMA_ORG_MAP[clean]) return SCHEMA_ORG_MAP[clean];
  for (const [key, val] of Object.entries(SCHEMA_ORG_MAP)) {
    if (clean.includes(key)) return val;
  }
  return null;
}

export function ogTypeToCategory(type: string): string | null {
  const clean = type.trim().toLowerCase();
  if (OG_TYPE_MAP[clean]) return OG_TYPE_MAP[clean];
  for (const [key, val] of Object.entries(OG_TYPE_MAP)) {
    if (clean.startsWith(key)) return val;
  }
  return null;
}

export function ogSectionToCategory(section: string): string | null {
  const s = section.trim().toLowerCase();
  if (!s) return null;
  const synonyms: Record<string, string> = {
    tech: "Desarrollo",
    technology: "Desarrollo",
    programming: "Desarrollo",
    code: "Código",
    software: "Herramientas",
    tools: "Herramientas",
    design: "Diseño",
    ux: "Diseño",
    ui: "Diseño",
    business: "Producto",
    product: "Producto",
    marketing: "Producto",
    news: "Noticias",
    world: "Noticias",
    politics: "Noticias",
    science: "Referencia",
    education: "Aprendizaje",
    learning: "Aprendizaje",
    tutorial: "Aprendizaje",
    food: "Cocina",
    cooking: "Cocina",
    recipes: "Cocina",
    music: "Música",
    video: "Video",
    entertainment: "Video",
    culture: "Lectura",
    books: "Lectura",
    literature: "Lectura",
    health: "Referencia",
    sports: "Referencia",
    travel: "Referencia",
    finance: "Referencia",
    lifestyle: "Lectura",
    opinion: "Lectura",
    arts: "Diseño",
    photography: "Diseño",
  };
  if (synonyms[s]) return synonyms[s];
  for (const [key, val] of Object.entries(synonyms)) {
    if (s.includes(key)) return val;
  }
  return null;
}