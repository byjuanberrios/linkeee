import { NextRequest, NextResponse } from "next/server";
import { classifyUrl } from "@/lib/classify/classify";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL es requerida" },
        { status: 400 }
      );
    }

    const apiKey = process.env.URLMETA_API_KEY;

    if (!apiKey) {
      console.error(
        "URLMETA_API_KEY no está configurada en las variables de entorno"
      );
      return NextResponse.json(
        { success: false, error: "Configuración de API incompleta" },
        { status: 500 }
      );
    }

    // 1. Fetch metadata via URLMeta
    const response = await fetch(
      `https://api.urlmeta.org/meta?url=${encodeURIComponent(url)}`,
      {
        headers: {
          Authorization: `Basic ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error de urlmeta.org: ${response.status}`);
    }

    const data = await response.json();

    if (data.result && data.result.status === "OK") {
      const metadata = data.meta;

      if (!metadata.title || metadata.title.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            error: "No se pudo obtener el título de la página",
          },
          { status: 404 }
        );
      }

      // 2. Intentar fetch del HTML para clasificación (best-effort, no bloquea)
      let html: string | undefined;
      try {
        const htmlRes = await fetch(url, {
          headers: { "User-Agent": "Linkeee/1.0 (+bookmark manager)" },
          signal: AbortSignal.timeout(8000),
        });
        if (htmlRes.ok) {
          html = await htmlRes.text();
        }
      } catch {
        // Si no podemos traer el HTML, seguimos con path heuristics
      }

      // 3. Clasificar
      const classification = classifyUrl(url, html);

      return NextResponse.json({
        success: true,
        title: metadata.title,
        description: metadata.description,
        category: classification.category,
        tags: classification.tags,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "No se encontraron metadatos para esta URL" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error al obtener metadatos:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}