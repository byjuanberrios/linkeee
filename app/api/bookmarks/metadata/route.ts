import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL es requerida" },
        { status: 400 }
      );
    }

    // Obtener el Bearer Token desde las variables de entorno
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

    // Hacer la petición a urlmeta.org con autenticación Basic Auth
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

      // Verificar si el título está vacío
      if (!metadata.title || metadata.title.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            error: "No se pudo obtener el título de la página",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        title: metadata.title,
        description: metadata.description,
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
