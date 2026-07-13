import type { NextAuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { readFileSync } from "fs"
import { join } from "path"

const githubId = process.env.GITHUB_ID
const githubSecret = process.env.GITHUB_SECRET

function getPasswordHash(): string | null {
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
      const passwordHash = getPasswordHash()

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
}