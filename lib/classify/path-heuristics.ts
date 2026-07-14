import "server-only";

const PATH_RULES: { pattern: RegExp; category: string }[] = [
  { pattern: /\/watch\?|\/watch\/|\/embed\/|\/video\/|\.webm$|\.mp4$/i, category: "Video" },
  { pattern: /\/blog\/|\/posts?\/|\/article\/|\/articles?\/|\/essay/i, category: "Lectura" },
  { pattern: /\/docs?\/|\/documentation\/|\/reference\/|\/manual\/|\/guide\/|\/api\//i, category: "Documentación" },
  { pattern: /\/recipe/i, category: "Cocina" },
  { pattern: /\/course\/|\/tutorial\/|\/learn\/|\/lesson\/|\/class\/|\/cursos?\/|\/clase\//i, category: "Aprendizaje" },
  { pattern: /\/podcast|\/episode/i, category: "Lectura" },
  { pattern: /\/product\/|\/shop\/|\/store\/|\/item\/|\/buy\//i, category: "Producto" },
  { pattern: /\/pull\/|\/pr\/|\/issues?\/|\/commit\/|\/tree\//i, category: "Código" },
  { pattern: /\/repos?\/|\/repo\/|gist\.github/i, category: "Código" },
  { pattern: /\/wiki\/|wikipedia\.org\/wiki\//i, category: "Referencia" },
  { pattern: /\/jobs?\/|\/careers?\/|\/vacanc/i, category: "Referencia" },
  { pattern: /\/event\/|\/events?\//i, category: "Referencia" },
  { pattern: /\/album\/|\/track\/|\/playlist\/|\/song\//i, category: "Música" },
  { pattern: /\/tag\/|\/tags?\/|\/topic\/|\/topics?\//i, category: "Referencia" },
];

export function classifyByPath(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    for (const rule of PATH_RULES) {
      if (rule.pattern.test(path)) {
        return rule.category;
      }
    }
    return null;
  } catch {
    return null;
  }
}