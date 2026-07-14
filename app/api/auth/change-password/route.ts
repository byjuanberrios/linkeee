import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, invalidatePasswordHashCache } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";

const AUTH_EMAIL = process.env.AUTH_EMAIL;

function getFallbackHash(): string | null {
  const fromEnv = process.env.AUTH_PASSWORD_HASH;
  if (fromEnv && fromEnv.includes("$2")) return fromEnv;
  try {
    const hashPath = join(process.cwd(), ".auth_hash");
    const fileHash = readFileSync(hashPath, "utf8").trim();
    if (fileHash) return fileHash;
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (AUTH_EMAIL && session.user.email !== AUTH_EMAIL.trim().toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Faltan la contraseña actual o la nueva" },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    if (newPassword.length > 72) {
      return NextResponse.json(
        { error: "La contraseña no puede superar 72 caracteres" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const doc = await db.collection("auth_config").findOne(
      { key: "password_hash" },
      { projection: { hash: 1 } }
    );

    let activeHash = doc?.hash ?? null;
    if (!activeHash || typeof activeHash !== "string" || !activeHash.includes("$2")) {
      activeHash = getFallbackHash();
    }

    if (!activeHash) {
      return NextResponse.json(
        { error: "No hay contraseña configurada en el servidor" },
        { status: 500 }
      );
    }

    const valid = await bcrypt.compare(currentPassword, activeHash);
    if (!valid) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 401 }
      );
    }

    const sameAsCurrent = await bcrypt.compare(newPassword, activeHash);
    if (sameAsCurrent) {
      return NextResponse.json(
        { error: "La nueva contraseña debe ser distinta a la actual" },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.collection("auth_config").updateOne(
      { key: "password_hash" },
      { $set: { hash: newHash, updated_at: new Date().toISOString() } },
      { upsert: true }
    );

    await invalidatePasswordHashCache();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("change-password error:", error);
    return NextResponse.json(
      { error: "No se pudo cambiar la contraseña" },
      { status: 500 }
    );
  }
}