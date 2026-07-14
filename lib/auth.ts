import "server-only";
import type { NextAuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { readFileSync } from "fs"
import { join } from "path"
import { getDb } from "@/lib/mongodb"

const githubId = process.env.GITHUB_ID
const githubSecret = process.env.GITHUB_SECRET

let cachedHash: string | null = null
let cacheCheckedMongo = false
let cacheSeededMongo = false

function getEnvOrFileHash(): string | null {
  const fromEnv = process.env.AUTH_PASSWORD_HASH
  if (fromEnv && fromEnv.includes("$2")) {
    return fromEnv
  }
  try {
    const hashPath = join(process.cwd(), ".auth_hash")
    const fileHash = readFileSync(hashPath, "utf8").trim()
    if (fileHash) return fileHash
  } catch {
    return null
  }
  return null
}

async function getPasswordHash(): Promise<string | null> {
  if (cachedHash) return cachedHash

  if (!cacheCheckedMongo) {
    cacheCheckedMongo = true
    try {
      const db = await getDb()
      const doc = await db.collection("auth_config").findOne(
        { key: "password_hash" },
        { projection: { hash: 1 } }
      )
      if (doc?.hash && typeof doc.hash === "string" && doc.hash.includes("$2")) {
        cachedHash = doc.hash
        return cachedHash
      }
    } catch {
      // fall through to env/file
    }
  }

  const fallback = getEnvOrFileHash()
  if (fallback) cachedHash = fallback

  if (fallback && !cacheSeededMongo) {
    cacheSeededMongo = true
    try {
      const db = await getDb()
      await db.collection("auth_config").updateOne(
        { key: "password_hash" },
        { $setOnInsert: { hash: fallback, key: "password_hash", seeded_from: "file_or_env", created_at: new Date().toISOString() } },
        { upsert: true }
      )
    } catch {
      // seeding is best-effort
    }
  }

  return fallback
}

export async function invalidatePasswordHashCache(): Promise<void> {
  cachedHash = null
  cacheCheckedMongo = false
  cacheSeededMongo = false
}

const providers: NextAuthOptions["providers"] = []

if (githubId && githubSecret && githubId.trim() !== "" && githubSecret.trim() !== "") {
  providers.push(
    GitHubProvider({
      clientId: githubId,
      clientSecret: githubSecret,
    })
  )
}

providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "tu@email.com" },
      password: { label: "Contraseña", type: "password" },
    },
    async authorize(credentials) {
      const allowedEmail = process.env.AUTH_EMAIL
      const passwordHash = await getPasswordHash()

      if (!allowedEmail || !passwordHash) {
        throw new Error("Auth no configurada en el servidor")
      }

      const email = credentials?.email?.trim().toLowerCase()
      const password = credentials?.password ?? ""

      if (!email || !password) {
        return null
      }

      if (email !== allowedEmail.trim().toLowerCase()) {
        return null
      }

      const valid = await bcrypt.compare(password, passwordHash)
      if (!valid) {
        return null
      }

      return {
        id: email,
        email,
        name: "Juan Berrios",
        image: null,
      }
    },
  })
)

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider) {
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { provider?: string }).provider =
          (token.provider as string | undefined) ?? null
      }
      return session
    },
  },
}